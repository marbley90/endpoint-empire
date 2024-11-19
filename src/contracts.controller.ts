import { Controller, Get, Param, Req, NotFoundException, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { Request } from 'express';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { DatabaseOperationsService } from './database/database-operations.service';
import { Contract } from './models/contract.model';

@Controller('contracts')
export class ContractsController {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly databaseOperationsService: DatabaseOperationsService,
  ) {}

  @Get(':id')
  async getContract(@Param('id') id: number, @Req() req: Request) {
    const profile = req['profile'];
    const cacheKey = `contract_${profile.id}_${id}`;

    const cachedContract = await this.cacheManager.get<Contract>(cacheKey);
    if (cachedContract) {
      return cachedContract;
    }

    try {
      const contract = await this.databaseOperationsService.findContractById(id, profile.id, profile.type);

      if (!contract) {
        throw new NotFoundException('Contract not found or does not belong to the profile');
      }

      // Cache the contract for future requests
      await this.cacheManager.set(cacheKey, contract, 3600000); // Cache for 1 hour

      return contract;
    } catch (error) {
      console.error(`An error occurred during fetching contract for profile ${profile.id}`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get()
  async getContracts(@Req() req: any): Promise<Contract[]> {
    const profile = req.profile;
    const cacheKey = `contracts_${profile.id}`;

    const cachedContracts = await this.cacheManager.get<Contract[]>(cacheKey);
    if (cachedContracts) {
      return cachedContracts;
    }

    try {
      const contracts = await this.databaseOperationsService.getUserContracts(profile.id);

      // Cache the contracts for future requests
      await this.cacheManager.set(cacheKey, contracts, 3600000); // Cache for 1 hour

      return contracts;
    } catch (error) {
      console.error(`An error occurred during fetching non-terminated contracts for profile ${profile.id}`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}