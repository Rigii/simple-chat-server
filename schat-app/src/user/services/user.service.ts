import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserProfile } from '../schemas/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(UserProfile.name) private UserProfileModel: Model<UserProfile>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const result = await this.UserProfileModel.create(createUserDto);
    const userObject = result.toObject();

    return {
      _id: userObject._id.toString(),
      email: userObject.email,
      nickname: userObject.nickname,
      role: userObject.role,
    };
  }
}
