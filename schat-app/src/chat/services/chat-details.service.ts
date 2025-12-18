import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { ChatRoom, ChatRoomDocument } from '../schemas/chat-room.schema';
import { InjectModel } from '@nestjs/mongoose/dist/common/mongoose.decorators';
import { Model } from 'mongoose';
import { ActiveConnectionsService } from './active-connections.service';
import { GetRoomDataDto } from '../dto/room-message.dto';
import { RoomMessage } from '../schemas/room-message.schema';
import { strings } from '../strings';
import { AddParticipantToChatRoomDto } from '../dto/update-chat.dto';
import { UserProfile } from 'src/user/schemas/user.schema';
import { UserService } from 'src/user/services/user.service';

@Injectable()
export class ChatDetailsService {
  private readonly logger = new Logger(ChatDetailsService.name);

  constructor(
    @InjectModel(ChatRoom.name)
    private ChatRoomModel: Model<ChatRoomDocument>,
    @InjectModel(RoomMessage.name) private RoomMessageModel: Model<RoomMessage>,
    private readonly redisService: RedisService,
    private readonly activeConnectionsService: ActiveConnectionsService,
    private readonly userProfileService: UserService,
  ) {}

  async storeChatRoomWithCache(room: ChatRoom): Promise<ChatRoom | null> {
    const cacheKey = `chatroom:${room._id}`;
    await this.redisService.set(cacheKey, JSON.stringify(room), 3600);

    return room;
  }

  async getChatRoomWithCache(chatRoomId: string): Promise<ChatRoom | null> {
    const cacheKey = `chatroom:${chatRoomId}`;
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached as string);
    }

    const room = await this.ChatRoomModel.findById(chatRoomId)
      .populate('participants')
      .lean()
      .exec();

    if (room) {
      await this.redisService.set(cacheKey, JSON.stringify(room), 3600000); // 1 hour TTL
    }

    return room;
  }

  async getInterlocutorChatRoomsFromCache(
    interlocutorRoomIds: string[],
  ): Promise<ChatRoom[]> {
    try {
      const rooms: ChatRoom[] = [];
      const missingRoomIds: string[] = [];

      for (const roomId of interlocutorRoomIds) {
        const key = `chatroom:${roomId}`;
        const cached = await this.redisService.client.get(key);

        if (cached) {
          rooms.push(JSON.parse(cached as string) as ChatRoom);
        } else {
          missingRoomIds.push(roomId);
        }
      }
      if (missingRoomIds.length === 0) {
        return rooms;
      }

      const dbRooms = await this.ChatRoomModel.find({
        _id: { $in: missingRoomIds },
      })
        .populate('participants')
        .lean()
        .exec();

      for (const room of dbRooms) {
        await this.redisService.set(
          `chatroom:${room._id}`,
          JSON.stringify(room),
          3600000,
        );
        rooms.push(room);
      }

      return rooms;
    } catch (error) {
      throw new NotFoundException({
        message: strings.gettingInterlocutorChatRoomsIssue,
        details: error.message,
      });
    }
  }

  async getAllAvailableRooms(): Promise<ChatRoom[]> {
    const rooms = await this.ChatRoomModel.find()
      .populate('participants')
      .lean()
      .exec();

    return rooms;
  }

  async getRoomData(getRoomDataDto: GetRoomDataDto): Promise<{
    messages: RoomMessage[];
    activeParticipants: string[];
    roomData: ChatRoom;
  }> {
    try {
      const isParticipant = await this.ChatRoomModel.findById(
        getRoomDataDto.chatRoomId,
      );

      if (!isParticipant) {
        throw new Error(
          strings.userNotParticipantOfChatRoom
            .replace('${userId}', getRoomDataDto.userId)
            .replace('${roomId}', getRoomDataDto.chatRoomId),
        );
      }

      const limit = getRoomDataDto.chunkLimit ?? 250;
      const roomMessages = await this.RoomMessageModel.find({
        chatRoomId: getRoomDataDto.chatRoomId,
      }).limit(limit);

      const activeParticipants =
        await this.activeConnectionsService.getAllParticipantsInRoomConnection(
          getRoomDataDto.chatRoomId,
        );

      const roomData = await this.getChatRoomWithCache(
        getRoomDataDto.chatRoomId,
      );
      return {
        messages: roomMessages,
        roomData,
        activeParticipants: Array.from(activeParticipants?.values()),
      };
    } catch (error) {
      this.logger.error('Getting Room Details error:', error.message);
      throw new Error(error);
    }
  }

  async addNewParticipantToRoom(
    dto: AddParticipantToChatRoomDto,
  ): Promise<{ currentRoomData: ChatRoom; currentUserData: UserProfile }> {
    let currentRoomData: ChatRoom;
    let currentUserData: UserProfile;

    try {
      currentRoomData = await this.ChatRoomModel.findByIdAndUpdate(
        dto.roomId.toString(),
        { $addToSet: { participants: dto.userId } },
        { new: true },
      )
        .populate('participants')
        .lean()
        .exec();

      this.storeChatRoomWithCache(currentRoomData);

      try {
        currentUserData = await this.userProfileService.addRoomToUser(
          dto.userId,
          dto.roomId,
        );

        return { currentRoomData, currentUserData };
      } catch (userError) {
        await this.ChatRoomModel.findByIdAndUpdate(dto.roomId.toString(), {
          $pull: { participants: dto.userId },
        }).exec();

        throw new Error(
          `${strings.failedAddRoomsToUserProfile} ${userError.message}`,
        );
      }
    } catch (error) {
      throw error;
    }
  }
}
