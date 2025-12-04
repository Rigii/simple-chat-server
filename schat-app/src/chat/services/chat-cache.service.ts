import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { ChatRoom } from '../schemas/chat-room.schema';
import { InjectModel } from '@nestjs/mongoose/dist/common/mongoose.decorators';
import { Model } from 'mongoose';

@Injectable()
export class ChatCacheService {
  constructor(
    @InjectModel(ChatRoom.name)
    private ChatRoomModel: Model<ChatRoom>,
    private readonly redisService: RedisService,
  ) {}

  async storeChatRoomWithCache(room: ChatRoom): Promise<ChatRoom | null> {
    const cacheKey = `chatroom:${room._id}`;
    const cached = await this.redisService.client.get(cacheKey);

    if (cached) {
      return JSON.parse(cached as string);
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

    const room = await this.ChatRoomModel.findById(chatRoomId);

    if (room) {
      await this.redisService.set(cacheKey, JSON.stringify(room), 3600000); // 1 hour TTL
    }

    return room;
  }
}
