import { Injectable, OnModuleInit } from '@nestjs/common';
import { MOCKED_CHAT_ROOMS } from '../constants/mocked';
import { ChatRoom } from '../schemas/chat-room.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class ChatService implements OnModuleInit {
  constructor(
    @InjectModel(ChatRoom.name) private chatRoomModel: Model<ChatRoom>,
  ) {}

  private async initializeDefaultChatRooms() {
    try {
      const roomPromises = MOCKED_CHAT_ROOMS.map((room) => {
        return this.chatRoomModel.create({ chat_name: room.chat_name });
      });

      await Promise.all(roomPromises);

      return;
    } catch (error) {
      console.error('Error initializing chat rooms:', error);
    }
  }

  async onModuleInit() {
    this.initializeDefaultChatRooms();
  }
}
