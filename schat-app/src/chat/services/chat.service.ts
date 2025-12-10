import { Injectable, OnModuleInit } from '@nestjs/common';
import { MOCKED_CHAT_ROOMS } from '../constants/chat.mocked';
import { ChatRoom, ChatRoomDocument } from '../schemas/chat-room.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Namespace, Socket } from 'socket.io';
import { chatRoomEmitEvents } from '../constants/chat.events';
import { strings } from '../strings';
import { UserProfile } from 'src/user/schemas/user.schema';
import { ChatCacheService } from './chat-cache.service';

@Injectable()
export class ChatService implements OnModuleInit {
  constructor(
    @InjectModel(ChatRoom.name) private chatRoomModel: Model<ChatRoomDocument>,
    @InjectModel(UserProfile.name) private userProfileModel: Model<UserProfile>,
    private readonly chatCacheService: ChatCacheService,
  ) {}

  private async createDefaultChatRoomDBRecords() {
    try {
      const existingRooms = await this.chatRoomModel
        .find()
        .populate('participants')
        .lean()
        .exec();

      if (existingRooms.length) {
        for (const room of existingRooms) {
          await this.chatCacheService.storeChatRoomWithCache(room);
        }
        return;
      }

      MOCKED_CHAT_ROOMS.map((room) => {
        return this.chatRoomModel.create({ chat_name: room.chat_name });
      });
      return;
    } catch (error) {
      console.error('Error initializing chat rooms:', error);
    }
  }

  async onModuleInit() {
    this.createDefaultChatRoomDBRecords();
  }

  getCurrentUserAccountData = async (userId: string) => {
    return await this.userProfileModel.findById(userId).exec();
  };

  getCurrentUser = async (userId: string) => {
    return await this.userProfileModel.findById(userId).exec();
  };

  async addInterlocutorToActiveUsers({
    clientId,
    userId,
    nickname,
    activeUsers,
  }: {
    clientId: string;
    userId: string;
    nickname: string;
    activeUsers: Map<string, Set<string>>;
  }) {
    console.log(`User ${nickname} ${clientId} is active.`);

    if (!activeUsers.has(userId)) {
      activeUsers.set(userId, new Set());
    }

    if (activeUsers.get(userId).has(clientId)) {
      return;
    }
    // Add clientId (device id) to the set of active client devices for the user
    activeUsers.get(userId).add(clientId);
  }

  handleJoinUserDefaultChatRooms = async ({
    client,
    userId,
    nickname,
    io,
  }: {
    client: Socket;
    userId: string;
    nickname: string;
    io: Namespace;
  }) => {
    try {
      const chatRooms = await this.chatCacheService.getAllChatRoomsFromCache();
      for (const room of chatRooms) {
        await this.handleJoinChat({
          client,
          dto: { userId },
        });

        io.to(room._id.toString()).emit(chatRoomEmitEvents.USER_JOINED_CHAT, {
          message: strings.joinChatSuccess
            .replace('${chatName}', room.chat_name)
            .replace('${userNickname}', nickname),
          data: {
            roomId: room._id.toString(),
            roomName: room.chat_name,
            userId,
            nickname,
          },
        });

        console.log(`User ${nickname} joined room: ${room._id.toString()}`);
      }
    } catch (error) {
      client.emit(chatRoomEmitEvents.JOIN_CHAT_ERROR, {
        message: error.message,
      });
    }
  };

  async handleJoinChat({
    client,
    dto,
  }: {
    client: Socket;
    dto: { userId: string };
  }) {
    try {
      const chatRooms = await this.chatCacheService.getAllChatRoomsFromCache();
      const chatIds = chatRooms.map((room) => room._id.toString());

      for (const chatId of chatIds) {
        await this.chatRoomModel.findByIdAndUpdate(
          chatId,
          { $addToSet: { participants: dto.userId } },
          { new: true },
        );
      }

      client.join(chatIds);
    } catch (error) {
      console.error(strings.joinChatError, error);
      client.emit(chatRoomEmitEvents.JOIN_CHAT_ERROR, {
        message: error.message,
      });
    }
  }

  async roomsDisconnectInterlocutor({
    client,
    userId,
    nickname,
    activeUsers,
    io,
  }: {
    client: Socket;
    userId: string;
    nickname: string;
    activeUsers: Map<string, Set<string>>;
    io: Namespace;
  }) {
    try {
      if (activeUsers.has(userId)) {
        const userConnections = activeUsers.get(userId);
        userConnections.delete(client.id);

        if (userConnections.size === 0) {
          activeUsers.delete(userId);
          console.log(
            strings.userHasNoMoreActiveConnections
              .replace('${nickname}', nickname)
              .replace('${userId}', userId),
          );
        } else {
          console.log(
            strings.userHasOtherActiveConnections
              .replace('${nickname}', nickname)
              .replace('${userId}', userId)
              .replace('${connectionsCount}', userConnections.size.toString()),
          );
        }
      }

      const chatRooms = await this.chatCacheService.getAllChatRoomsFromCache();
      for (const room of chatRooms) {
        io.to(room._id.toString()).emit(
          chatRoomEmitEvents.PARTICIPANT_DISCONNECTED,
          {
            message: strings.disconnectChatSuccess
              .replace('${chatName}', room.chat_name)
              .replace('${userNickname}', nickname),
            data: { roomId: room._id.toString(), userId, nickname },
          },
        );

        console.log(`User ${nickname} left room: ${room._id.toString()}`);
      }
    } catch (error) {
      console.error(strings.userDisconnectingError, error);

      // Fallback cleanup
      if (activeUsers.has(userId)) {
        const userConnections = activeUsers.get(userId);
        userConnections.delete(client.id);
        if (userConnections.size === 0) {
          activeUsers.delete(userId);
        }
      }
    }
  }

  async userLeftChat({
    client,
    userId,
    nickname,
    io,
  }: {
    client: Socket;
    userId: string;
    nickname: string;
    io: Namespace;
  }) {
    const chatRooms = await this.chatCacheService.getAllChatRoomsFromCache();

    for (const room of chatRooms) {
      await client.leave(room._id.toString());

      /* Unbind User profile record with chat record */
      await this.chatRoomModel.findByIdAndUpdate(
        room._id.toString(),
        { $pull: { participants: userId } },
        { new: true },
      );

      io.to(room._id.toString()).emit(chatRoomEmitEvents.USER_LEFT_CHAT, {
        message: strings.leaveChatSuccess
          .replace('${chatName}', room.chat_name)
          .replace('${userNickname}', nickname),
        data: { roomId: room._id.toString(), userId, nickname },
      });

      console.log(`User ${nickname} left room: ${room._id.toString()}`);
    }
  }
}
