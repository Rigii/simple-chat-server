import { Injectable, OnModuleInit } from '@nestjs/common';
import { MOCKED_CHAT_ROOMS } from '../constants/chat.mocked';
import { ChatRoom, ChatRoomDocument } from '../schemas/chat-room.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Namespace, Socket } from 'socket.io';
import { chatRoomEmitEvents } from '../constants/chat.events';
import { strings } from '../strings';

@Injectable()
export class ChatService implements OnModuleInit {
  constructor(
    @InjectModel(ChatRoom.name) private chatRoomModel: Model<ChatRoomDocument>,
    // @InjectModel(UserProfile.name)
    // private userProfileModel: Model<UserProfileDocument>,
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

  // private async getUserFromChat({
  //   roomId,
  //   userId,
  // }: {
  //   roomId: string;
  //   userId: string;
  // }): Promise<UserProfile | null> {
  //   const chatRoom = await this.chatRoomModel
  //     .findOne({
  //       _id: roomId,
  //       participants: userId,
  //     })
  //     .populate({
  //       path: 'participants',
  //       match: { _id: userId },
  //       select: 'nickname email',
  //     })
  //     .exec();

  //   if (!chatRoom || chatRoom.participants.length === 0) {
  //     return null;
  //   }

  //   return chatRoom.participants[0]; // Вернет только указанного пользователя
  // }

  async onModuleInit() {
    this.initializeDefaultChatRooms();
  }

  async getAllDefaultChatRooms(): Promise<ChatRoom[]> {
    const roomNames = MOCKED_CHAT_ROOMS.map((room) => room.chat_name);
    return await this.chatRoomModel
      .find({
        chat_name: { $in: roomNames },
      })
      .exec();
  }

  async addInterlocutorToActiveUsers({
    clientId,
    userId,
    activeUsers,
  }: {
    clientId: string;
    userId: string;
    activeUsers: Map<string, Set<string>>;
  }) {
    if (!activeUsers.has(userId)) {
      activeUsers.set(userId, new Set());
    }

    if (activeUsers.get(userId).has(clientId)) {
      return;
    }

    activeUsers.get(userId).add(clientId);
  }

  async addUserToChatRoomRecord(
    roomId: string,
    userId: string,
  ): Promise<ChatRoom> {
    const chatRoom = await this.chatRoomModel
      .findByIdAndUpdate(
        roomId,
        {
          $addToSet: { participants: userId },
        },
        { new: true },
      )
      .populate('participants', 'nickname email');

    if (!chatRoom) {
      throw new Error('Chat room not found');
    }

    return chatRoom;
  }

  handleJoinSingleUserDefaultChatRooms = async ({
    client,
    userId,
    roomId,
    activeUsers,
    io,
  }: {
    client: Socket;
    userId: string;
    roomId: string;
    activeUsers: Map<string, Set<string>>;
    io: Namespace;
  }) => {
    try {
      const chatRooms = await this.getAllDefaultChatRooms();
      chatRooms.map(async (room: ChatRoom) => {
        await this.handleJoinChat({
          client,
          dto: { userId },
          activeUsers,
        });

        io.to(roomId).emit(chatRoomEmitEvents.USER_JOINED_CHAT, {
          message: strings.joinChatSuccess.replace(
            '${chatName}',
            room.chat_name,
          ),
        });

        client.emit(chatRoomEmitEvents.JOIN_CHAT_SUCCESS, {
          message: strings.joinChatSuccess.replace(
            '${chatName}',
            room.chat_name,
          ),
        });
      });
    } catch (error) {
      client.emit(chatRoomEmitEvents.JOIN_CHAT_ERROR, {
        message: error.message,
      });
    }
  };

  async roomsDisconnectInterlocutor({
    clientId,
    userId,
    activeUsers,
    io,
  }: {
    clientId: string;
    userId: string;
    activeUsers: Map<string, Set<string>>;
    io: Namespace;
  }) {
    try {
      if (activeUsers.has(userId)) {
        activeUsers.get(userId).delete(clientId);

        if (activeUsers.get(userId).size === 0) {
          activeUsers.delete(userId);
          console.log(`User ${userId} is no longer active.`);
        }
      }

      const roomsWithCurrentUser = Array.from(activeUsers.entries()).filter(
        ([, sockets]) => sockets.has(userId),
      );

      for (const [roomId, sockets] of roomsWithCurrentUser) {
        sockets.forEach((socketId) => {
          io.to(socketId).emit(chatRoomEmitEvents.USER_LEFT_CHAT, {
            userId,
            room: roomId,
          });
        });
      }
    } catch (error) {
      console.error(strings.userDisconnectingError, error);
    }
  }

  async handleJoinChat({
    client,
    dto,
    activeUsers,
  }: {
    client: Socket;
    dto: { userId: string };
    activeUsers: Map<string, Set<string>>;
  }) {
    const { userId } = dto;

    try {
      const chatRooms = await this.getAllDefaultChatRooms();
      const chatIds = chatRooms.map((room) => room._id.toString());

      chatIds.forEach((chatId) => {
        if (!activeUsers.has(chatId)) {
          activeUsers.set(userId, new Set());
        }
        activeUsers.get(chatId).add(userId);
      });

      client.join(chatIds);
    } catch (error) {
      console.error(strings.joinChatError, error);
      client.emit(chatRoomEmitEvents.JOIN_CHAT_ERROR, {
        message: error.message,
      });
    }
  }
}
