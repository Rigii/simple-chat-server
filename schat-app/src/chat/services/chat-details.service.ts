import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { ChatRoom, ChatRoomDocument } from '../schemas/chat-room.schema';
import { InjectModel } from '@nestjs/mongoose/dist/common/mongoose.decorators';
import { Model } from 'mongoose';
import { ActiveConnectionsService } from './active-connections.service';
import { GetRoomMessagesDto } from '../dto/room-message.dto';
import { RoomMessage } from '../schemas/room-message.schema';
import { strings } from '../strings';

/* 
ChatDetailsService
The service stores chat rooms in cache (1 hour) only if chat rooms was requested 
*/
@Injectable()
export class ChatDetailsService {
  constructor(
    @InjectModel(ChatRoom.name)
    private ChatRoomModel: Model<ChatRoomDocument>,
    private readonly redisService: RedisService,
    @InjectModel(RoomMessage.name) private RoomMessageModel: Model<RoomMessage>,
    private readonly activeConnectionsService: ActiveConnectionsService,
  ) {}

  async storeChatRoomWithCache(room: ChatRoom): Promise<ChatRoom | null> {
    const cacheKey = `chatroom:${room._id}`;
    const cached = await this.redisService.client.get(cacheKey);
    if (cached) {
      return JSON.parse(cached as string) as ChatRoom;
    }
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

  /* For the demonstration purposes. Should return only rooms by provided room id's */
  async getAllChatRoomsFromCache(): Promise<ChatRoom[]> {
    const keys = await this.redisService.client.keys('chatroom:*');
    const rooms: ChatRoom[] = [];

    for (const key of keys) {
      const cached = await this.redisService.client.get(key);
      if (cached) {
        rooms.push(JSON.parse(cached as string) as ChatRoom);
      }
    }

    if (!rooms.length) {
      const dbRooms = await this.ChatRoomModel.find()
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
    }

    return rooms;
  }

  async getRoomData(
    getRoomDataDto: GetRoomMessagesDto,
  ): Promise<{ messages: RoomMessage[]; activeParticipants: string[] }> {
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

      return {
        messages: roomMessages,
        activeParticipants: Array.from(activeParticipants?.values()),
      };
    } catch (error) {
      console.error('Getting Room Details error:', error.message);
      throw new Error(error);
    }
  }
}
