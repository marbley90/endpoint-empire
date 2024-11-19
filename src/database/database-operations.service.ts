import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { literal, Op, Transaction } from 'sequelize';
import { Contract } from '../models/contract.model';
import { Job } from '../models/job.model';
import { Profile } from '../models/profile.model';

@Injectable()
export class DatabaseOperationsService {
  constructor(private sequelize: Sequelize,
              @InjectModel(Contract) private contractModel: typeof Contract,
              @InjectModel(Job) private readonly jobModel: typeof Job,
              @InjectModel(Profile) private readonly profileModel: typeof Profile,
  ) {}


  /**
   * Finds a contract by id and ensures it's associated with the profile (either as client or contractor).
   * This method is wrapped inside a transaction for isolation.
   *
   * @param id - Contract ID
   * @param profileId - ID of the user making the request
   * @param profileType - Type of the profile, either 'client' or 'contractor'
   * @returns The found contract or null if not found
   */
  async findContractById(id: number, profileId: string, profileType: string) {
    const transaction = await this.sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.READ_COMMITTED,
    });

    try {
      // Query contract with the specified transaction and isolation level
      const contract = await this.contractModel.findOne({
        where: {
          id,
          [profileType === 'client' ? 'ClientId' : 'ContractorId']: profileId,
        },
        transaction, // Attach the transaction to the query
      });

      if (!contract) {
        // If no contract is found, rollback the transaction and return null
        await transaction.rollback();
        return null;
      }

      // Commit the transaction if the contract is found
      await transaction.commit();

      return contract; // Return the contract
    } catch (error) {
      // In case of an error, rollback the transaction
      await transaction.rollback();
      throw error; // Re-throw the error to be handled by the caller
    }
  }


  async getUserContracts(profileId: number): Promise<Contract[]> {
    const transaction = await this.sequelize.transaction();

    try {
      const contracts = await this.contractModel.findAll({
        where: {
          [Op.or]: [
            { ClientId: profileId },
            { ContractorId: profileId },
          ],
          status: {
            [Op.ne]: 'terminated',
          },
        },
        transaction, // Associate the query with the transaction
      });

      await transaction.commit();

      return contracts;
    } catch (error) {
      await transaction.rollback(); // Rollback the transaction in case of an error
      throw error;
    }
  }

  async getUnpaidJobs(profileId: number): Promise<Job[]> {
    const transaction = await this.sequelize.transaction();

    try {
      const jobs = await this.jobModel.findAll({
        include: [
          {
            model: Contract,
            required: true,
            where: {
              [Op.or]: [{ ClientId: profileId }, { ContractorId: profileId }],
              status: 'in_progress', // Only active contracts
            },
          },
        ],
        where: {
          paid: false, // Unpaid jobs only
        },
        transaction,
      });

      await transaction.commit();
      return jobs;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async payJob(jobId: number, profile: any): Promise<{ success: boolean; message: string }> {
    const transaction: Transaction = await this.sequelize.transaction();

    try {
      // Fetch the job with contract details
      const job: any = await this.jobModel.findOne({
        where: { id: jobId },
        include: [
          {
            model: Contract,
            required: true,
            where: {
              ClientId: profile.id, // Ensure only the client can pay
            },
          },
        ],
        transaction,
      });

      if (!job) {
        throw new Error('Job not found or you do not have access to it.');
      }

      if (job.paid) {
        throw new Error('Job is already paid.');
      }

      const client = profile; // Profile comes from middleware
      const contractorId = job.Contract.ContractorId;
      const jobPrice = job.price;

      if (client.balance < jobPrice) {
        throw new Error('Insufficient balance to pay for the job.');
      }

      // Update balances
      await this.sequelize.models.Profile.update(
        { balance: client.balance - jobPrice },
        { where: { id: client.id }, transaction },
      );

      await this.sequelize.models.Profile.update(
        { balance: Sequelize.literal(`balance + ${jobPrice}`) },
        { where: { id: contractorId }, transaction },
      );

      // Mark job as paid
      job.paid = true;
      job.paymentDate = new Date();
      await job.save({ transaction });

      await transaction.commit();
      return { success: true, message: 'Job paid successfully.' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async depositToClientBalance(userId: number, amount: number): Promise<string> {
    const transaction = await this.sequelize.transaction();

    try {
      const jobsToPay = await this.jobModel.findAll({
        include: {
          model: Contract,
          required: true,
          where: { ClientId: userId, status: 'in_progress' },
        },
        where: { paid: false },
        attributes: [[literal('SUM(price)'), 'total']],
        group: ['Contract.ClientId'],
        transaction,
      });

      const totalJobsToPay = jobsToPay.reduce((acc, job) => acc + Number(job.get('total')), 0);

      if (amount > totalJobsToPay * 0.25) {
        throw new Error('Deposit exceeds 25% of the total jobs to pay.');
      }

      const client = await this.profileModel.findByPk(userId, { transaction });
      if (!client || client.type !== 'client') {
        throw new Error('User is not a client or does not exist.');
      }

      client.balance += amount;
      await client.save({ transaction });

      await transaction.commit();

      return 'Deposit successful.';
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getBestProfession(start: Date, end: Date): Promise<string> {
    const transaction = await this.sequelize.transaction();

    try {
      const [result]: any[] = await this.jobModel.findAll({
        attributes: [
          [Sequelize.literal('"Contract->Contractor"."profession"'), 'profession'],
          [Sequelize.literal('SUM("Job"."price")'), 'total_earnings'],
        ],
        include: [
          {
            model: Contract, // Ensure this matches the model correctly
            required: true,
            include: [
              {
                model: Profile,
                as: 'Contractor', // Alias matches your association
                required: true,
              },
            ],
          },
        ],
        where: {
          paid: true,
          paymentDate: {
            [Op.between]: [start, end],
          },
        },
        group: ['Contract->Contractor.profession'],
        order: [[Sequelize.literal('total_earnings'), 'DESC']],
        limit: 1,
        transaction,
      });

      await transaction.commit();

      return result ? result.profession : 'No data available.';
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async getBestClients(start: Date, end: Date, limit: number): Promise<any[]> {
    const transaction = await this.sequelize.transaction();

    try {
      const clients = await this.jobModel.findAll({
        attributes: [
          [Sequelize.literal('"Contract->Client"."id"'), 'id'],
          [Sequelize.literal('"Contract->Client"."firstName" || " " || "Contract->Client"."lastName"'), 'fullName'],
          [Sequelize.literal('SUM("Job"."price")'), 'total_paid'],
        ],
        include: [
          {
            model: Contract,
            required: true,
            include: [
              {
                model: Profile,
                as: 'Client', // Alias matches your association
                required: true,
              },
            ],
          },
        ],
        where: {
          paid: true,
          paymentDate: {
            [Op.between]: [start, end],
          },
        },
        group: ['Contract->Client.id'],
        order: [[Sequelize.literal('total_paid'), 'DESC']],
        limit,
        transaction,
      });

      await transaction.commit();

      return clients.map(client => client.get());
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}