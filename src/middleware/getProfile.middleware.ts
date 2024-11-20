import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Request, Response, NextFunction } from 'express';
import { Profile } from '../models/profile.model';

@Injectable()
export class GetProfileMiddleware implements NestMiddleware {
  constructor(@InjectModel(Profile) private profileModel: typeof Profile) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Retrieve profile_id from request header
    const profileId = req.get('profile_id') || 0;

    // Use Sequelize to find the profile by ID
    const profile = await this.profileModel.findOne({ where: { id: profileId } });

    // If no profile is found, throw UnauthorizedException
    if (!profile) {
      throw new UnauthorizedException('Profile not found');
    }

    req['profile'] = profile;
    next();
  }
}
