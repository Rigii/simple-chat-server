import { Injectable } from '@nestjs/common';
import { DefaultEventsMap, Namespace, Socket } from 'socket.io';
import {
  roomMessageStatusEvent,
  socketMessageNamespaces,
} from '../constants/chat.events';
import { ChatCacheService } from './chat-cache.service';
import { PostRoomMessageDto } from '../dto/room-message.dto';
import { InjectModel } from '@nestjs/mongoose';
import { RoomMessage } from '../schemas/room-message.schema';
import { Model } from 'mongoose';
import { strings } from '../strings';

@Injectable()
export class MessageService {
  constructor(
    private readonly chatCacheService: ChatCacheService,
    @InjectModel(RoomMessage.name) private RoomMessageModel: Model<RoomMessage>,
  ) {}

  postNotificationMessageToInterlocutors({
    userIds,
    event,
    data,
    activeUsers,
    io,
  }: {
    userIds: string[];
    event: string;
    data: any;
    activeUsers: Map<string, Set<string>>;
    io: Namespace;
  }) {
    userIds.forEach((userId) => {
      const sockets = activeUsers.get(userId);
      if (sockets) {
        sockets.forEach((socketId) => {
          io.to(socketId).emit(event, data);
        });
      }
    });
  }

  async postRoomMessage({
    dto,
    client,
    activeUsers,
    io,
  }: {
    dto: PostRoomMessageDto;
    client: Socket;
    activeUsers: Map<string, Set<string>>;
    io: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
  }): Promise<RoomMessage | void> {
    try {
      const { chatRoomId, message, senderId, senderName } = dto;

      /* Check if the user is in the chat room. Update cache if he's not */
      const currentChatRoom =
        await this.chatCacheService.getChatRoomWithCache(chatRoomId);

      if (!currentChatRoom) {
        const errorMessage = strings.chatRoomsNotFound.replace(
          '${roomIds}',
          chatRoomId,
        );

        console.error('Chat room not found');
        client.emit(roomMessageStatusEvent.ROOM_MESSAGE_FAILED, errorMessage);
        return;
      }

      /* Save message to the Mongo DB */
      const createdRoomMessage = await new this.RoomMessageModel({
        participantId: senderId,
        nickname: senderName,
        message,
        chatRoomId,
        isAdmin: false,
      });

      const savedMessage = await createdRoomMessage.save();
      const response = {
        id: savedMessage._id.toString(),
        ...savedMessage.toObject(),
      };

      /* If the user not awailable in the chatroom, send message to his private channel */
      const interlocutorIds =
        currentChatRoom.participants.map(
          (participant) => participant.interlocutor_id,
        ) || [];

      const activeChatUsers = activeUsers.get(chatRoomId);

      interlocutorIds.forEach((interlocutorId) => {
        if (activeChatUsers?.has(interlocutorId)) {
          return;
        }

        this.postInterlocutorServiceMessage({
          userIds: [interlocutorId],
          event: socketMessageNamespaces.CHAT_ROOM_MESSAGE,
          data: response,
          activeUsers: activeUsers,
          io,
        });
      });

      io.to(chatRoomId).emit(
        socketMessageNamespaces.CHAT_ROOM_MESSAGE,
        response,
      );

      return;
    } catch (error) {
      console.error('Error while posting message', error);
      client.emit(
        roomMessageStatusEvent.ROOM_MESSAGE_FAILED,
        strings.postChatRoomMessageError,
      );
    }
  }

  async postInterlocutorServiceMessage({
    userIds,
    event,
    data,
    activeUsers,
    io,
  }: {
    userIds: string[];
    event: string;
    data: any;
    activeUsers: Map<string, Set<string>>;
    io: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
  }) {
    userIds.forEach((userId) => {
      const sockets = activeUsers.get(userId);
      if (sockets) {
        sockets.forEach((socketId) => {
          io.to(socketId).emit(event, data);
        });
      }
    });
  }
}
