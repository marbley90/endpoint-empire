import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Profile } from './models/profile.model';
import { Contract } from './models/contract.model';
import { Job } from './models/job.model';
import { GetProfileMiddleware } from './middleware/getProfile.middleware';
import { DatabaseOperationsService } from './database/database-operations.service';
import { JobsController } from './jobs.controller';
import { AdminController } from './admin.controller';
import { CacheModule, CacheStore } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'sqlite',
      storage: 'database.sqlite',
      autoLoadModels: true,
      synchronize: true,
    }),
    CacheModule.registerAsync({
      useFactory: async () => {
        const store = await redisStore({
          socket: {
            host: 'localhost',
            port: 6379,
          },
        });

        return {
          store: store as unknown as CacheStore,
          ttl: 3600000
        };
      },
    }),
    SequelizeModule.forFeature([Profile, Contract, Job]),
  ],
  controllers: [
    ContractsController,
    JobsController,
    AdminController
  ],
  providers: [DatabaseOperationsService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply GetProfileMiddleware to specific routes (contracts/:id)
    consumer
      .apply(GetProfileMiddleware)
      .forRoutes(ContractsController, JobsController, AdminController);
  }
}
