import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { ChatRoom, ChatRoomDocument } from '../schemas/chat-room.schema';
import { InjectModel } from '@nestjs/mongoose/dist/common/mongoose.decorators';
import { Model } from 'mongoose';

/* 
ChatCacheService
The service stores chat rooms in cache (1 hour) only if chat rooms was requested 
*/
@Injectable()
export class ChatCacheService {
  constructor(
    @InjectModel(ChatRoom.name)
    private ChatRoomModel: Model<ChatRoomDocument>,
    private readonly redisService: RedisService,
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
    console.log(555555, 'CACHED_ROOM', cached);

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
    console.log(7777777, 'CACHED_ROOMS', rooms);

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
}
