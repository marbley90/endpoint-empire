import { DatabaseOperationsService } from './database/database-operations.service';
import { Controller, Get, HttpException, HttpStatus, Param, Post, Req } from '@nestjs/common';

@Controller('jobs')
export class JobsController {
  constructor(private readonly databaseOperationsService: DatabaseOperationsService) {}

  @Get('unpaid')
  async getUnpaidJobs(@Req() req: any) {
    const profile = req.profile;
    try {
      return await this.databaseOperationsService.getUnpaidJobs(profile.id);
    } catch (error) {
      console.error(`An error occurred during fetching unpaid jobs`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':job_id/pay')
  async payJob(@Param('job_id') jobId: string, @Req() req: any) {
    const profile = req.profile;
    try {
      return await this.databaseOperationsService.payJob(+jobId, profile);
    } catch (error) {
      console.error(`An error occurred during paying job ${jobId}`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}