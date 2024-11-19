import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  HttpException,
  HttpStatus,
  Inject
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBody, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { DatabaseOperationsService } from './database/database-operations.service';

@ApiTags('Admin')
@Controller()
export class AdminController {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly databaseOperationsService: DatabaseOperationsService
  ) {}

  @Post('balances/deposit/:userId')
  @ApiOperation({ summary: 'Deposit money into a client’s balance' })
  @ApiHeader({
    name: 'profile_id',
    description: 'ID of the authenticated profile (used for authentication)',
    required: true,
    example: '123',
  })
  @ApiParam({
    name: 'userId',
    description: 'ID of the user (client) receiving the deposit',
    example: '1',
  })
  @ApiBody({
    description: 'Amount to deposit',
    schema: {
      type: 'object',
      properties: {
        amount: { type: 'number', example: 100 },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Deposit successful' })
  @ApiResponse({ status: 400, description: 'Invalid deposit amount or error occurred' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Profile not found' })
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
  @ApiOperation({ summary: 'Get the profession that earned the most money' })
  @ApiHeader({
    name: 'profile_id',
    description: 'ID of the authenticated profile (used for authentication)',
    required: true,
    example: '123',
  })
  @ApiQuery({
    name: 'start',
    description: 'Start date for the query range (YYYY-MM-DD)',
    example: '2023-01-01',
  })
  @ApiQuery({
    name: 'end',
    description: 'End date for the query range (YYYY-MM-DD)',
    example: '2023-12-31',
  })
  @ApiResponse({ status: 200, description: 'Profession with the most earnings', schema: { example: { profession: 'Engineer' } } })
  @ApiResponse({ status: 400, description: 'Invalid date range or error occurred' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Profile not found' })
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
  @ApiOperation({ summary: 'Get the best clients based on paid jobs' })
  @ApiHeader({
    name: 'profile_id',
    description: 'ID of the authenticated profile (used for authentication)',
    required: true,
    example: '123',
  })
  @ApiQuery({
    name: 'start',
    description: 'Start date for the query range (YYYY-MM-DD)',
    example: '2023-01-01',
  })
  @ApiQuery({
    name: 'end',
    description: 'End date for the query range (YYYY-MM-DD)',
    example: '2023-12-31',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of top clients to retrieve (default is 2)',
    example: 5,
  })
  @ApiResponse({
    status: 200,
    description: 'List of top clients based on payments made',
    schema: {
      example: {
        clients: [
          { id: 1, fullName: 'John Doe', totalPaid: 5000 },
          { id: 2, fullName: 'Jane Smith', totalPaid: 4000 },
        ],
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid date range or error occurred' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Profile not found' })
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
