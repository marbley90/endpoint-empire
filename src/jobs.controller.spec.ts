import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { JobsController } from './jobs.controller';
import { DatabaseOperationsService } from './database/database-operations.service';

describe('JobsController', () => {
  let controller: JobsController;
  let service: DatabaseOperationsService;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [
        {
          provide: DatabaseOperationsService,
          useValue: {
            getUnpaidJobs: jest.fn(),
            payJob: jest.fn(),
          },
        },
        {
          provide: CACHE_MANAGER,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<JobsController>(JobsController);
    service = module.get<DatabaseOperationsService>(DatabaseOperationsService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  it('should return cached unpaid jobs if available', async () => {
    const mockJobs: any[] = [
      {
        id: 1,
        description: 'Test job',
        price: 100,
        paid: false,
        paymentDate: new Date(),
        ContractId: 1,
      },
    ];

    jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(mockJobs);

    const result = await controller.getUnpaidJobs({ profile: { id: 123 } });
    expect(result).toEqual(mockJobs);
    expect(service.getUnpaidJobs).not.toHaveBeenCalled();
  });

  it('should fetch unpaid jobs and cache them if not in cache', async () => {
    const mockJobs: any[] = [
      {
        id: 1,
        description: 'Test job',
        price: 100,
        paid: false,
        paymentDate: new Date(),
        ContractId: 1,
      },
    ];

    jest.spyOn(cacheManager, 'get').mockResolvedValueOnce(null);
    jest.spyOn(service, 'getUnpaidJobs').mockResolvedValueOnce(mockJobs);
    jest.spyOn(cacheManager, 'set').mockResolvedValueOnce(null);

    const result = await controller.getUnpaidJobs({ profile: { id: 123 } });
    expect(result).toEqual(mockJobs);
    expect(service.getUnpaidJobs).toHaveBeenCalledWith(123);
    expect(cacheManager.set).toHaveBeenCalledWith('unpaid_jobs_123', mockJobs, 3600000);
  });

  it('should successfully pay for a job', async () => {
    const jobId = '1';
    const mockProfile = { id: 123 };
    const updatedJob = {
      success: true,
      message: 'Successfully paid for the job',
    };

    jest.spyOn(service, 'payJob').mockResolvedValue(updatedJob);
    jest.spyOn(cacheManager, 'del').mockResolvedValueOnce(null);

    const result = await controller.payJob(jobId, { profile: mockProfile });

    expect(result).toEqual(updatedJob);
    expect(service.payJob).toHaveBeenCalledWith(1, mockProfile);
    expect(cacheManager.del).toHaveBeenCalledWith('unpaid_jobs_123');
  });

  it('should throw a 400 error if paying for a job fails', async () => {
    const jobId = '1';
    const mockProfile = { id: 123 };

    const errorMessage = 'Error paying for the job';
    jest.spyOn(service, 'payJob').mockRejectedValueOnce(new Error(errorMessage));

    const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});

    try {
      await controller.payJob(jobId, { profile: mockProfile });
    } catch (e) {
      expect(e).toBeInstanceOf(HttpException);
      expect(e.message).toEqual(errorMessage); // Check the message directly
      expect(e.getStatus()).toBe(HttpStatus.BAD_REQUEST);
    }

    consoleErrorMock.mockRestore();

    expect(service.payJob).toHaveBeenCalledWith(1, mockProfile);
  });
});
