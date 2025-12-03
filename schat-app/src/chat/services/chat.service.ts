import { Injectable, OnModuleInit } from '@nestjs/common';
import { MOCKED_CHAT_ROOMS } from '../constants/mocked';
import { ChatRoom } from '../schemas/chat-room.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Namespace, Socket } from 'socket.io';

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

  handleJoinSingleUserChatRoom = async ({
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
      const chatRoom = await this.chatRoomRepository.findOne({
        where: { id: roomId },
        relations: ['participants'],
      });

      const isInterlocutorRelatedToChatRoom = chatRoom.participants.find(
        (participant) => participant.interlocutor_id === userId,
      );

      if (!isInterlocutorRelatedToChatRoom) {
        const errorMessage = strings.userNotInvited;
        throw new Error(errorMessage);
      }

      const roomParticipiantsPublicKeys = chatRoom.participants.map(
        (participant) => {
          return participant.public_chat_key;
        },
      );

      await this.handleJoinChat({
        client,
        dto: { userChatIds: [roomId], interlocutorId: userId },
        activeUsers,
      });

      io.to(roomId).emit(chatRoomEmitEvents.USER_JOINED_CHAT, {
        message: strings.privateRoomCreated,
      });

      client.emit(chatRoomEmitEvents.JOIN_CHAT_SUCCESS, {
        message: strings.joinChatSuccess.replace(
          '${chatName}',
          chatRoom.chat_name,
        ),
        data: roomParticipiantsPublicKeys,
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
      userChatIds.forEach((chatId) => {
        if (!activeUsers.has(chatId)) {
          activeUsers.set(userId, new Set());
        }

        /* Adding interlocutor to the chat */
        activeUsers.get(chatId).add(interlocutorId);
      });

      /* Adding (activating) Room Id in the socket client flow */
      client.join(userChatIds);
    } catch (error) {
      console.error(strings.joinChatError, error);
      client.emit(chatRoomEmitEvents.JOIN_CHAT_ERROR, {
        message: error.message,
      });
    }
  }
}
