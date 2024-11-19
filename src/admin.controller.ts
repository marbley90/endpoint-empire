import { Controller, Get, Post, Param, Query, Body, HttpException, HttpStatus, Inject } from '@nestjs/common';
import { DatabaseOperationsService } from './database/database-operations.service';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';

@Controller()
export class AdminController {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly databaseOperationsService: DatabaseOperationsService
  ) {}

  @Post('balances/deposit/:userId')
  async depositToBalance(@Param('userId') userId: string, @Body('amount') amount: number) {
    try {
      if (amount <= 0) {
        throw new HttpException('Invalid deposit amount.', HttpStatus.BAD_REQUEST);
      }

      const message = await this.databaseOperationsService.depositToClientBalance(+userId, amount);

      return { success: true, message };
    } catch (error) {
      console.error(`An error occurred during depositing to user ${userId}`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('admin/best-profession')
  async getBestProfession(@Query('start') start: string, @Query('end') end: string) {
    const cacheKey = `best_profession_${start}_${end}`;

    try {
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new HttpException('Invalid date range.', HttpStatus.BAD_REQUEST);
      }

      const profession = await this.databaseOperationsService.getBestProfession(startDate, endDate);

      await this.cacheManager.set(cacheKey, { profession }, 3600000);

      return { profession };
    } catch (error) {
      console.error(`An error occurred during getting best profession`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('admin/best-clients')
  async getBestClients(
    @Query('start') start: string,
    @Query('end') end: string,
    @Query('limit') limit = 2, // Default limit is 2
  ) {
    const cacheKey = `best_clients_${start}_${end}_${limit}`;

    try {
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new HttpException('Invalid date range.', HttpStatus.BAD_REQUEST);
      }

      const clients = await this.databaseOperationsService.getBestClients(startDate, endDate, +limit);

      await this.cacheManager.set(cacheKey, { clients }, 3600000);

      return { clients };
    } catch (error) {
      console.error(`An error occurred during fetching best clients`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
