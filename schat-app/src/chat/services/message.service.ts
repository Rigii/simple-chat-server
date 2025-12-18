import { Injectable, Logger } from '@nestjs/common';
import { DefaultEventsMap, Namespace, Socket } from 'socket.io';
import {
  roomMessageStatusEvent,
  socketMessageNamespaces,
} from '../constants/chat.events';
import { GetRoomDataDto, PostRoomMessageDto } from '../dto/room-message.dto';
import { InjectModel } from '@nestjs/mongoose';
import { RoomMessage } from '../schemas/room-message.schema';
import { Model } from 'mongoose';
import { strings } from '../strings';
import { ChatDetailsService } from './chat-details.service';
import { ChatRoom, ChatRoomDocument } from '../schemas/chat-room.schema';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    @InjectModel(ChatRoom.name)
    private chatRoomModel: Model<ChatRoomDocument>,
    @InjectModel(RoomMessage.name) private RoomMessageModel: Model<RoomMessage>,
    private readonly chatDetailsService: ChatDetailsService,
  ) {}

  async postRoomMessage({
    payload,
    client,
    io,
  }: {
    payload: PostRoomMessageDto;
    client: Socket;
    io: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
  }): Promise<RoomMessage | void> {
    try {
      const { chatRoomId, message, participantId, nickname } = payload;
      const currentChatRoom =
        await this.chatDetailsService.getChatRoomWithCache(chatRoomId);

      if (!currentChatRoom) {
        const errorMessage = strings.chatRoomsNotFound.replace(
          '${roomIds}',
          chatRoomId,
        );

        this.logger.error(strings.chatRoomsNotFound, chatRoomId);
        client.emit(roomMessageStatusEvent.ROOM_MESSAGE_FAILED, errorMessage);
        return;
      }

      /* Check if user related to the chatroom */
      const isParticipant = currentChatRoom.participants.some((participant) =>
        participant._id.toString().includes(participantId),
      );

      if (!isParticipant) {
        const errorMessage = strings.userNotParticipantOfChatRoom
          .replace('${userId}', participantId)
          .replace('${roomId}', chatRoomId);

        this.logger.error(
          strings.userNotParticipantOfChatRoom,
          participantId,
          chatRoomId,
        );

        client.emit(roomMessageStatusEvent.ROOM_MESSAGE_FAILED, errorMessage);
        return;
      }
      /* Save message to the Mongo DB */
      const createdRoomMessage = await new this.RoomMessageModel({
        participantId: participantId,
        nickname: nickname,
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
      this.logger.error(strings.postChatRoomMessageError, error);
      client.emit(
        roomMessageStatusEvent.ROOM_MESSAGE_FAILED,
        strings.postChatRoomMessageError,
      );
    }
  }

  async getRoomMessages(
    GetRoomDataDto: GetRoomDataDto,
  ): Promise<RoomMessage[]> {
    const isParticipant = await this.chatRoomModel.findById(
      GetRoomDataDto.chatRoomId.toString(),
    );

    if (!isParticipant) {
      throw new Error(
        strings.userNotParticipantOfChatRoom
          .replace('${userId}', GetRoomDataDto.userId)
          .replace('${roomId}', GetRoomDataDto.chatRoomId),
      );
    }

    const limit = GetRoomDataDto.chunkLimit ?? 250;
    return this.RoomMessageModel.find({
      chatRoomId: GetRoomDataDto.chatRoomId,
    }).limit(limit);
  }
}
