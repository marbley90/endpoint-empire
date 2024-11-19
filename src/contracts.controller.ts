import { Controller, Get, HttpException, HttpStatus, NotFoundException, Param, Req } from '@nestjs/common';
import { AppService } from './app.service';
import { Contract } from './models/contract.model';
import { InjectModel } from '@nestjs/sequelize';
import { DatabaseOperationsService } from './database/database-operations.service';
import { logger } from 'sequelize/types/utils/logger';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly databaseOperationsService: DatabaseOperationsService) {}

  /**
   * Fetch contract by id.
   * Only the user associated with the contract (either as Client or Contractor) can access it.
   */
  @Get(':id')
  async getContract(@Param('id') id: number, @Req() req: Request) {
    // Retrieve the authenticated user's profile
    const profile = req['profile'];

    try {
      const contract = await this.databaseOperationsService.findContractById(id, profile.id, profile.type);

      if (!contract) {
        throw new NotFoundException('Contract not found or does not belong to the profile');
      }

      return contract;
    } catch (error) {
      console.error(`An error occurred during fetching contract for profile ${profile.id}`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async getContracts(@Req() req: any): Promise<Contract[]> {
    const profile = req.profile;
    try {
      return await this.databaseOperationsService.getUserContracts(profile.id);
    } catch (error) {
      console.error(`An error occurred during fetching non terminated contracts for profile ${profile.id}`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
