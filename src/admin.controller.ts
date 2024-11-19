import { Controller, Get, Post, Param, Query, Body, HttpException, HttpStatus } from '@nestjs/common';
import { DatabaseOperationsService } from './database/database-operations.service';

@Controller()
export class AdminController {
  constructor(private readonly databaseOperationsService: DatabaseOperationsService) {}

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
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new HttpException('Invalid date range.', HttpStatus.BAD_REQUEST);
      }

      const profession = await this.databaseOperationsService.getBestProfession(startDate, endDate);
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
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new HttpException('Invalid date range.', HttpStatus.BAD_REQUEST);
      }

      const clients = await this.databaseOperationsService.getBestClients(startDate, endDate, +limit);
      return { clients };
    } catch (error) {
      console.error(`An error occurred during fetching best clients`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
