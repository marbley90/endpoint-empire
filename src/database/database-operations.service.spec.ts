import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseOperationsService } from './database-operations.service';
import { Sequelize } from 'sequelize-typescript';
import { getModelToken } from '@nestjs/sequelize';
import { Contract } from '../models/contract.model';
import { Job } from '../models/job.model';
import { Profile } from '../models/profile.model';
import { Op } from 'sequelize';

describe('DatabaseOperationsService', () => {
  let service: DatabaseOperationsService;
  let sequelizeMock: Partial<Sequelize>;
  let contractModelMock: Partial<typeof Contract>;
  let jobModelMock: Partial<typeof Job>;
  let profileModelMock: Partial<typeof Profile>;

  beforeEach(async () => {
    sequelizeMock = {
      transaction: jest.fn().mockResolvedValue({
        commit: jest.fn(),
        rollback: jest.fn(),
      }),
    } as Partial<Sequelize>;

    contractModelMock = {
      findOne: jest.fn(),
      findAll: jest.fn(),
    } as Partial<typeof Contract>;

    jobModelMock = {
      findOne: jest.fn(),
      findAll: jest.fn(),
    } as Partial<typeof Job>;

    profileModelMock = {
      findByPk: jest.fn(),
      update: jest.fn(),
    } as Partial<typeof Profile>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseOperationsService,
        { provide: Sequelize, useValue: sequelizeMock },
        { provide: getModelToken(Contract), useValue: contractModelMock },
        { provide: getModelToken(Job), useValue: jobModelMock },
        { provide: getModelToken(Profile), useValue: profileModelMock },
      ],
    }).compile();

    service = module.get<DatabaseOperationsService>(DatabaseOperationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should find a contract by ID', async () => {
    const transaction = await sequelizeMock.transaction();

    (contractModelMock.findOne as jest.Mock).mockResolvedValue({
      id: 1,
      ClientId: 1,
    });

    const result = await service.findContractById(1, '1', 'client');

    expect(sequelizeMock.transaction).toHaveBeenCalled();
    expect(contractModelMock.findOne).toHaveBeenCalledWith({
      where: { id: 1, ClientId: '1' },
      transaction,
    });
    expect(transaction.commit).toHaveBeenCalled();
    expect(result).toEqual({ id: 1, ClientId: 1 });
  });

  it('should rollback transaction if no contract is found', async () => {
    const transaction = await sequelizeMock.transaction();

    (contractModelMock.findOne as jest.Mock).mockResolvedValue(null);

    const result = await service.findContractById(1, '1', 'client');

    expect(sequelizeMock.transaction).toHaveBeenCalled();
    expect(contractModelMock.findOne).toHaveBeenCalled();
    expect(transaction.rollback).toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should throw an error and rollback on exception', async () => {
    const transaction = await sequelizeMock.transaction();

    (contractModelMock.findOne as jest.Mock).mockRejectedValue(new Error('Database error'));

    await expect(service.findContractById(1, '1', 'client')).rejects.toThrow('Database error');

    expect(transaction.rollback).toHaveBeenCalled();
  });

  it('should retrieve user contracts', async () => {
    const transaction = await sequelizeMock.transaction();

    (contractModelMock.findAll as jest.Mock).mockResolvedValue([
      { id: 1, ClientId: 1, ContractorId: 2 },
    ]);

    const result = await service.getUserContracts(1);

    expect(sequelizeMock.transaction).toHaveBeenCalled();
    expect(contractModelMock.findAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [{ ClientId: 1 }, { ContractorId: 1 }],
        status: { [Op.ne]: 'terminated' },
      },
      transaction,
    });
    expect(transaction.commit).toHaveBeenCalled();
    expect(result).toEqual([{ id: 1, ClientId: 1, ContractorId: 2 }]);
  });

  it('should retrieve unpaid jobs', async () => {
    const transaction = await sequelizeMock.transaction();

    (jobModelMock.findAll as jest.Mock).mockResolvedValue([
      { id: 1, price: 200, paid: false },
    ]);

    const result = await service.getUnpaidJobs(1);

    expect(sequelizeMock.transaction).toHaveBeenCalled();
    expect(jobModelMock.findAll).toHaveBeenCalledWith({
      include: [
        {
          model: Contract,
          required: true,
          where: { [Op.or]: [{ ClientId: 1 }, { ContractorId: 1 }], status: 'in_progress' },
        },
      ],
      where: { paid: false },
      transaction,
    });
    expect(transaction.commit).toHaveBeenCalled();
    expect(result).toEqual([{ id: 1, price: 200, paid: false }]);
  });
});
