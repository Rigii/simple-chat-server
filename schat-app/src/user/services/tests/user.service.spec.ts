import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from '../user.service';

import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { CreateUserDto } from 'src/user/dto/user.dto';
import { UserProfile } from 'src/user/schemas/user.schema';
import {
  mockExistingUser,
  mockLogger,
  mockNewUser,
  mockUserProfileModel,
} from 'src/constants/tests-mocked-data';

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(UserProfile.name),
          useValue: mockUserProfileModel,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'new@example.com',
      nickname: 'newUser',
      role: 'user',
    };

    it('should create new user', async () => {
      mockUserProfileModel.findOne.mockResolvedValue(null);
      mockUserProfileModel.create.mockResolvedValue(mockNewUser);

      const result = await service.create({
        ...createUserDto,
        email: mockNewUser.email,
      });

      expect(mockUserProfileModel.findOne).toHaveBeenCalledWith({
        email: mockNewUser.email,
      });
      expect(mockUserProfileModel.create).toHaveBeenCalledWith({
        ...createUserDto,
        email: mockNewUser.email,
      });

      expect(result).toEqual({
        _id: mockNewUser._id.toString(),
        email: mockNewUser.email,
        nickname: mockNewUser.nickname,
        rooms: [],
        role: mockNewUser.role,
      });
    });

    it('should return existing user when email already exists', async () => {
      mockExistingUser.toObject.mockReturnValue(mockExistingUser);
      mockUserProfileModel.findOne.mockResolvedValue(mockExistingUser);

      const result = await service.create({
        ...createUserDto,
        email: mockExistingUser.email,
      });

      expect(mockUserProfileModel.findOne).toHaveBeenCalledWith({
        email: mockExistingUser.email,
      });
      expect(mockUserProfileModel.create).not.toHaveBeenCalled();
      expect(result).toEqual({
        _id: mockExistingUser._id.toString(),
        email: mockExistingUser.email,
        nickname: mockExistingUser.nickname,
        rooms: mockExistingUser.rooms ?? [],
        role: mockExistingUser.role,
      });
    });

    it('should get account data', async () => {
      mockExistingUser.toObject.mockReturnValue(mockExistingUser);
      mockUserProfileModel.findOne.mockResolvedValue(mockExistingUser);

      const result = await service.getCurrentUserAccountData(
        mockExistingUser._id.toString(),
      );

      expect(result).toEqual({
        _id: mockExistingUser._id.toString(),
        email: mockExistingUser.email,
        nickname: mockExistingUser.nickname,
        rooms: mockExistingUser.rooms ?? [],
        role: mockExistingUser.role,
      });
    });
  });
});
