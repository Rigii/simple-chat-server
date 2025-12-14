import { Module } from '@nestjs/common';
import { ChatService } from './services/chat.service';
import { ChatDetailsService } from './services/chat-details.service';
import { MessageService } from './services/message.service';
import { ChatGateway } from './gateways/chat.gateway';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatRoom, ChatRoomSchema } from './schemas/chat-room.schema';
import { UserProfile, UserProfileSchema } from 'src/user/schemas/user.schema';
import { RoomMessage, RoomMessageSchema } from './schemas/room-message.schema';
import { RedisService } from 'src/redis/redis.service';
import { ChatController } from './controllers/chat.controller';
import { ActiveConnectionsService } from './services/active-connections.service';
import { UserModule } from 'src/user/user.module';
import { InitDefaultRoomsService } from './services/init-default-rooms';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatRoom.name, schema: ChatRoomSchema },
      { name: UserProfile.name, schema: UserProfileSchema },
      { name: RoomMessage.name, schema: RoomMessageSchema },
    ]),
    UserModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatGateway,
    InitDefaultRoomsService,
    ChatService,
    MessageService,
    ChatDetailsService,
    RedisService,
    ActiveConnectionsService,
  ],
})
export class ChatModule {}
