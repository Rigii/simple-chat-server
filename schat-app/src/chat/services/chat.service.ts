import { Injectable, Logger } from '@nestjs/common';
import { ChatRoom, ChatRoomDocument } from '../schemas/chat-room.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Namespace, Socket } from 'socket.io';
import { chatRoomEmitEvents } from '../constants/chat.events';
import { strings } from '../strings';
import { ChatDetailsService } from './chat-details.service';
import { ActiveConnectionsService } from './active-connections.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectModel(ChatRoom.name) private chatRoomModel: Model<ChatRoomDocument>,
    private readonly chatDetailsService: ChatDetailsService,
    private readonly activeConnectionsService: ActiveConnectionsService,
  ) {}

  handleJoinUserRoom = async ({
    client,
    userId,
    roomId,
    nickname,
  }: {
    client: Socket;
    userId: string;
    roomId: string;
    nickname: string;
  }) => {
    try {
      /* Add room to global pool */
      this.activeConnectionsService.addRoomToGeneralPool(roomId);

      this.activeConnectionsService.addParticipantToRoomConnection(
        roomId,
        userId,
      );
      /* Join WebSocket room */
      await this.handleJoinChat({
        client,
        roomId,
      });

      this.logger.log(`${nickname} ${strings.joinedRoom} ${roomId}`);
    } catch (error) {
      client.emit(chatRoomEmitEvents.JOIN_CHAT_ERROR, {
        message: error.message,
      });
    }
  };

  async handleJoinChat({ client, roomId }: { client: Socket; roomId: string }) {
    try {
      /* Join Participant to the room */
      client.join([roomId]);
    } catch (error) {
      this.logger.error(strings.joinChatError, error);
      client.emit(chatRoomEmitEvents.JOIN_CHAT_ERROR, {
        message: error.message,
      });
    }
  }

  async disconnectInterlocutorAllRooms({
    client,
    userId,
    nickname,
    interlocutorRoomIds,
    io,
  }: {
    client: Socket;
    userId: string;
    nickname: string;
    interlocutorRoomIds: string[];
    io: Namespace;
  }) {
    try {
      this.activeConnectionsService.removeParticipantNestedConnection(
        userId,
        client.id,
      );

      const connectionsPerParticipant =
        this.activeConnectionsService.getAllParticipantsPoolConnection(userId);

      if (connectionsPerParticipant.size === 0) {
        this.activeConnectionsService.deleteUserGeneralConnection(userId);

        this.logger.log(
          `${nickname}: ${strings.userHasNoMoreActiveConnections}`,
        );
      } else {
        this.logger.log(`${nickname} ${strings.userHasOtherActiveConnections},
        `);
      }

      /* Deleeting participant id from the rooms */
      const chatRooms =
        await this.chatDetailsService.getInterlocutorChatRoomsFromCache(
          interlocutorRoomIds,
        );
      for (const room of chatRooms) {
        await this.handleLeaveUserRoom({
          client,
          userId,
          nickname,
          roomId: room._id.toString(),
          roomName: room.chat_name,
          io,
        });
      }
    } catch (error) {
      this.logger.error(strings.userDisconnectingError, error);
    }
  }

  async handleLeaveUserRoom({
    client,
    userId,
    nickname,
    roomId,
    roomName,
    io,
  }: {
    client: Socket;
    userId: string;
    nickname: string;
    roomId: string;
    roomName?: string;
    io: Namespace;
  }) {
    client.leave(roomId);

    /* Emitting Participiant Leave Room message  */
    io.to(roomId).emit(chatRoomEmitEvents.PARTICIPANT_DISCONNECTED, {
      message: strings.disconnectChatSuccess
        .replace('${chatName}', roomName || '')
        .replace('${userNickname}', nickname),
      data: { roomId: roomId, userId, nickname },
    });

    /* Removing User Id from the Chat Room Online Interlocutors pull */
    this.activeConnectionsService.removeParticipantRoomConnection(
      roomId,
      userId,
    );

    this.logger.log(`${nickname} ${strings.leftRoom} ${roomId}`);
  }
}
