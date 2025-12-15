import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateUserDto } from '../dto/user.dto';
import { UserProfile } from '../schemas/user.schema';
import { strings } from '../strings';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(UserProfile.name) private UserProfileModel: Model<UserProfile>,
  ) {}

  async getCurrentUserAccountData(userId: string) {
    const user = await this.UserProfileModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException(strings.userNotFound);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto) {
    try {
      const presentedResult = await this.UserProfileModel.findOne({
        email: createUserDto.email,
      });

      const existingObject = presentedResult?.toObject();

      if (existingObject) {
        return {
          ...existingObject,
          _id: existingObject._id.toString(),
        };
      }

      const created = await this.UserProfileModel.create(createUserDto);
      const createdObject = created.toObject();

      return {
        ...createdObject,
        _id: createdObject._id.toString(),
      };
    } catch (error) {
      this.logger.error(strings.userAccessError);
      throw error;
    }
  }

  async addRoomToUser(userId: string, roomId: string): Promise<UserProfile> {
    return this.UserProfileModel.findByIdAndUpdate(
      userId,
      { $addToSet: { rooms: roomId } },
      { new: true },
    ).exec();
  }
}
