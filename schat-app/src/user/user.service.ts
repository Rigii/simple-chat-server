import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UserProfile } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserProfile.name) private UserProfileModel: Model<UserProfile>,
  ) {}

  create(createUserDto: CreateUserDto) {
    this.UserProfileModel.create(createUserDto);
  }
}
