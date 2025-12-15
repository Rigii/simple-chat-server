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

      if (presentedResult?.toObject()) {
        return presentedResult;
      }

      const result = await this.UserProfileModel.create(createUserDto);
      const userObject = result?.toObject();

      return {
        _id: userObject._id.toString(),
        email: userObject.email,
        nickname: userObject.nickname,
        rooms: userObject.rooms,
        role: userObject.role || 'user',
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
