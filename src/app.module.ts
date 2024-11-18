import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SequelizeModule } from '@nestjs/sequelize';
import { Profile } from './models/profile.model';
import { Contract } from './models/contract.model';
import { Job } from './models/job.model';

@Module({
  imports: [
    SequelizeModule.forRoot({
      dialect: 'sqlite',
      storage: 'database.sqlite', // SQLite database file
      autoLoadModels: true,
      synchronize: true,
    }),
    SequelizeModule.forFeature([Profile, Contract, Job]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
