import { DatabaseOperationsService } from './database/database-operations.service';
import { Controller, Get, HttpException, HttpStatus, Inject, Param, Post, Req } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Job } from './models/job.model';

@Controller('jobs')
export class JobsController {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly databaseOperationsService: DatabaseOperationsService
  ) {}

  @Get('unpaid')
  async getUnpaidJobs(@Req() req: any) {
    const profile = req.profile;
    const cacheKey = `unpaid_jobs_${profile.id}`;
    const cachedUnpaidJobs = await this.cacheManager.get<Job[]>(cacheKey);

    if (cachedUnpaidJobs) {
      return cachedUnpaidJobs;
    }
    try {
      const unpaidJobs = await this.databaseOperationsService.getUnpaidJobs(profile.id);

      await this.cacheManager.set(cacheKey, unpaidJobs, 3600000);

      return unpaidJobs;
    } catch (error) {
      console.error(`An error occurred during fetching unpaid jobs`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post(':job_id/pay')
  async payJob(@Param('job_id') jobId: string, @Req() req: any) {
    const profile = req.profile;
    const cacheKey = `unpaid_jobs_${profile.id}`; // Cache key for unpaid jobs

    try {
      const updateJob = await this.databaseOperationsService.payJob(+jobId, profile);

      await this.cacheManager.del(cacheKey); // Delete the cached unpaid jobs (if any)

      return updateJob;
    } catch (error) {
      console.error(`An error occurred during paying job ${jobId}`, error);
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}