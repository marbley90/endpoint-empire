import { DatabaseOperationsService } from './database/database-operations.service';
import { Controller, Get, HttpException, HttpStatus, Inject, Param, Post, Req } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { Job } from './models/job.model';

@ApiTags('Jobs')
@ApiHeader({
  name: 'profile_id',
  description: 'ID of the authenticated user',
  required: true,
})
@Controller('jobs')
export class JobsController {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly databaseOperationsService: DatabaseOperationsService,
  ) {}

  @Get('unpaid')
  @ApiOperation({ summary: 'Get all unpaid jobs for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'List of unpaid jobs for active contracts',
    schema: {
      type: 'array',
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request error' })
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
  @ApiOperation({ summary: 'Pay for a job' })
  @ApiParam({
    name: 'job_id',
    description: 'The ID of the job to pay for',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully paid for the job',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request error' })
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
