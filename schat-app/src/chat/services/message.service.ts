import { Injectable } from '@nestjs/common';
import { DefaultEventsMap, Namespace, Socket } from 'socket.io';
import {
  roomMessageStatusEvent,
  socketMessageNamespaces,
} from '../constants/chat.events';
import {
  GetRoomMessagesDto,
  PostRoomMessageDto,
} from '../dto/room-message.dto';
import { InjectModel } from '@nestjs/mongoose';
import { RoomMessage } from '../schemas/room-message.schema';
import { Model } from 'mongoose';
import { strings } from '../strings';
import { ChatCacheService } from './chat-cache.service';
import { ChatRoom, ChatRoomDocument } from '../schemas/chat-room.schema';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(ChatRoom.name)
    private chatRoomModel: Model<ChatRoomDocument>,
    @InjectModel(RoomMessage.name) private RoomMessageModel: Model<RoomMessage>,
    private readonly chatCacheService: ChatCacheService,
  ) {}

  async postRoomMessage({
    payload,
    client,
    io,
  }: {
    payload: PostRoomMessageDto;
    client: Socket;
    activeUsers: Map<string, Set<string>>;
    io: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
  }): Promise<RoomMessage | void> {
    try {
      const { chatRoomId, message, senderId, senderName } = payload;

      const currentChatRoom =
        await this.chatCacheService.getChatRoomWithCache(chatRoomId);

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

      io.to(chatRoomId).emit(
        socketMessageNamespaces.CHAT_ROOM_MESSAGE,
        messageObject,
      );

      return savedMessage;
    } catch (error) {
      console.error(strings.postChatRoomMessageError, error);
      client.emit(
        roomMessageStatusEvent.ROOM_MESSAGE_FAILED,
        strings.postChatRoomMessageError,
      );
    }
  }

  async getRoomMessages(
    getRoomMessagesDto: GetRoomMessagesDto,
  ): Promise<RoomMessage[]> {
    const isParticipant = await this.chatRoomModel.findByIdAndUpdate(
      getRoomMessagesDto.chatRoomId,
      { $addToSet: { participants: getRoomMessagesDto.userId } },
      { new: true },
    );

    if (!isParticipant) {
      throw new Error(
        strings.userNotParticipantOfChatRoom
          .replace('${userId}', getRoomMessagesDto.userId)
          .replace('${roomId}', getRoomMessagesDto.chatRoomId),
      );
    }

    const limit = getRoomMessagesDto.chunkLimit ?? 50;
    return this.RoomMessageModel.find({
      chatRoomId: getRoomMessagesDto.chatRoomId,
    })
      .sort({ createdAt: 1 })
      .limit(limit);
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
