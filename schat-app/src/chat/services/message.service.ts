import { Injectable } from '@nestjs/common';
import { DefaultEventsMap, Namespace, Socket } from 'socket.io';
import {
  roomMessageStatusEvent,
  socketMessageNamespaces,
} from '../constants/chat.events';
import { PostRoomMessageDto } from '../dto/room-message.dto';
import { InjectModel } from '@nestjs/mongoose';
import { RoomMessage } from '../schemas/room-message.schema';
import { Model } from 'mongoose';
import { strings } from '../strings';
import { ChatCacheService } from './chat-cache.service';
import { ChatRoom } from '../schemas/chat-room.schema';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(ChatRoom.name)
    private ChatRoomModel: Model<ChatRoom>,
    private readonly chatCacheService: ChatCacheService,
    @InjectModel(RoomMessage.name) private RoomMessageModel: Model<RoomMessage>,
  ) {}

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
      console.log(7777777, dto);
      console.log(8888888, chatRoomId);

      const currentChatRoom = await this.ChatRoomModel.findById(chatRoomId);

      if (!currentChatRoom) {
        const errorMessage = strings.chatRoomsNotFound.replace(
          '${roomIds}',
          chatRoomId,
        );

        console.error(strings.chatRoomsNotFound, chatRoomId);
        client.emit(roomMessageStatusEvent.ROOM_MESSAGE_FAILED, errorMessage);
        return;
      }

      /* Check if user related to the chatroom */
      const isParticipant = currentChatRoom.participants.some((participant) =>
        participant._id.toString().includes(senderId),
      );

      if (!isParticipant) {
        const errorMessage = strings.userNotParticipantOfChatRoom
          .replace('${userId}', senderId)
          .replace('${roomId}', chatRoomId);

        console.error(
          strings.userNotParticipantOfChatRoom,
          senderId,
          chatRoomId,
        );

        console.log(3333333, chatRoomId);

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
      const messageObject = {
        id: savedMessage._id.toString(),
        ...savedMessage.toObject(),
      };

      /* If the user not available in the chatroom, send message to his private channel */
      const interlocutorIds =
        currentChatRoom.participants.map((participant) =>
          participant._id.toString(),
        ) || [];

      const activeChatUsers = activeUsers.get(chatRoomId);

      interlocutorIds.forEach((interlocutorId) => {
        if (activeChatUsers?.has(interlocutorId)) {
          return;
        }

        this.postInterlocutorServiceMessage({
          userIds: [interlocutorId],
          event: socketMessageNamespaces.CHAT_ROOM_MESSAGE,
          data: messageObject,
          activeUsers: activeUsers,
          io,
        });
      });

      io.to(chatRoomId).emit(
        socketMessageNamespaces.CHAT_ROOM_MESSAGE,
        messageObject,
      );

      return;
    } catch (error) {
      console.error(strings.postChatRoomMessageError, error);
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
