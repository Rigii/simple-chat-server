import { Injectable, OnModuleInit } from '@nestjs/common';
import { MOCKED_CHAT_ROOMS } from '../constants/chat.mocked';
import { ChatRoom, ChatRoomDocument } from '../schemas/chat-room.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class InitDefaultRoomsService implements OnModuleInit {
  constructor(
    @InjectModel(ChatRoom.name) private chatRoomModel: Model<ChatRoomDocument>,
  ) {}

  private async createDefaultChatRoomDBRecords() {
    try {
      for (const room of MOCKED_CHAT_ROOMS) {
        const existingRoom = await this.chatRoomModel.findOne({
          chat_name: room.chat_name,
        });

        if (!existingRoom) {
          await this.chatRoomModel.create({ chat_name: room.chat_name });
          console.log(`Created chat room: ${room.chat_name}`);
        } else {
          console.log(`Chat room "${room.chat_name}" already exists, skipping`);
        }
      }
      return;
    } catch (error) {
      console.error('Error initializing chat rooms:', error);
    }
  }

  async onModuleInit() {
    this.createDefaultChatRoomDBRecords();
  }
}
