import { Test, TestingModule } from '@nestjs/testing';

import { Logger } from '@nestjs/common';
import { getModelToken } from '@nestjs/mongoose';
import { UserProfile } from 'src/user/schemas/user.schema';

import { RoomMessage } from 'src/chat/schemas/room-message.schema';
import { ChatRoom } from 'src/chat/schemas/chat-room.schema';
import { ChatDetailsService } from '../chat-details.service';
import {
  mockChatRoomModel,
  mockRoomMessageModel,
  mockUserProfileModel,
} from 'src/constants/test/mocked-mongo-models';
import { RedisService } from 'src/redis/redis.service';
import {
  mockActiveConnectionsService,
  mockLoggerService,
  mockRedisService,
  mockUserService,
} from 'src/constants/test/mocked-services';
import { ActiveConnectionsService } from '../active-connections.service';
import { UserService } from 'src/user/services/user.service';
import { mockChatRoom } from 'src/constants/test/tests-mocked-data';

describe('ChatDetailsService', () => {
  let service: ChatDetailsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatDetailsService,

        {
          provide: getModelToken(ChatRoom.name),
          useValue: mockChatRoomModel,
        },
        {
          provide: getModelToken(UserProfile.name),
          useValue: mockUserProfileModel,
        },
        {
          provide: getModelToken(RoomMessage.name),
          useValue: mockRoomMessageModel,
        },

        {
          provide: RedisService,
          useValue: mockRedisService,
        },
        {
          provide: ActiveConnectionsService,
          useValue: mockActiveConnectionsService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
        {
          provide: Logger,
          useValue: mockLoggerService,
        },
      ],
    }).compile();

    service = module.get<ChatDetailsService>(ChatDetailsService);

    jest.clearAllMocks();
  });

  it('should return cached room if present in Redis', async () => {
    mockRedisService.get.mockResolvedValue(JSON.stringify(mockChatRoom));

    const result = await service.getChatRoomWithCache(mockChatRoom._id);

    expect(mockRedisService.get).toHaveBeenCalledWith(
      `chatroom:${mockChatRoom._id}`,
    );
    expect(mockChatRoomModel.findById).not.toHaveBeenCalled();

    expect(result._id).toBe(mockChatRoom._id);
    expect(result.chat_name).toBe(mockChatRoom.chat_name);
    expect(result.participants).toEqual(mockChatRoom.participants);

    expect(new Date(result.created)).toEqual(mockChatRoom.created);
    expect(new Date(result.updated)).toEqual(mockChatRoom.updated);
  });

  it('should return room from DB when cache is empty', async () => {
    mockRedisService.get.mockResolvedValue(null);

    mockChatRoomModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockChatRoom),
    });

    const result = await service.getChatRoomWithCache(mockChatRoom._id);

    expect(result).toEqual(mockChatRoom);
    expect(mockRedisService.set).toHaveBeenCalled();
  });
});
