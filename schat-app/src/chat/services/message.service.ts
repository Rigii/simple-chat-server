import { Injectable, Logger } from '@nestjs/common';
import { DefaultEventsMap, Namespace, Socket } from 'socket.io';
import {
  incommingEvents,
  roomMessageStatusEvent,
  socketMessageNamespaces,
} from '../constants/chat.events';
import { GetRoomDataDto, PostRoomMessageDto } from '../dto/room-message.dto';
import { InjectModel } from '@nestjs/mongoose';
import { RoomMessage } from '../schemas/room-message.schema';
import { Model } from 'mongoose';
import { strings } from '../strings';
import { ChatDetailsService } from './chat-details.service';
import { SChatRoom, ChatRoomDocument } from '../schemas/chat-room.schema';
import { ActiveConnectionsService } from './active-connections.service';
import { channelNamingContract } from 'src/constants/notification-channels';
import { SUserProfile } from 'src/user/schemas/user.schema';

@Injectable()
export class MessageService {
  private readonly logger = new Logger(MessageService.name);

  constructor(
    @InjectModel(SChatRoom.name)
    private chatRoomModel: Model<ChatRoomDocument>,
    @InjectModel(RoomMessage.name) private RoomMessageModel: Model<RoomMessage>,
    private readonly chatDetailsService: ChatDetailsService,
    private readonly activeConnectionsService: ActiveConnectionsService,
  ) {}

  async postMessageUnactiveParticipants({
    chatRoomId,
    currentChatRoomParticipants,
    message,
    nickname,
    io,
  }: {
    chatRoomId: string;
    currentChatRoomParticipants: SUserProfile[];
    message: string;
    nickname: string;
    io: Namespace<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>;
  }): Promise<RoomMessage | void> {
    const activeRoomParticipants =
      this.activeConnectionsService.getRoomParticipants(chatRoomId);

    const offlineParticipants = currentChatRoomParticipants.filter(
      (participant) => {
        return !activeRoomParticipants.has(participant._id.toString());
      },
    );

    for (const offlineParticipant of offlineParticipants) {
      const currentParticipantChannel = channelNamingContract.user(
        offlineParticipant._id.toString(),
      );

      io.to(currentParticipantChannel).emit(incommingEvents.CHAT_ROOM_MESSAGE, {
        chatRoomId,
        message,
        nickname,
        participantId: offlineParticipant._id.toString(),
      });
    }
  }

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

      await this.postMessageUnactiveParticipants({
        chatRoomId,
        currentChatRoomParticipants: currentChatRoom.participants,
        message,
        nickname,
        io,
      });

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
