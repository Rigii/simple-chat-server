import { Injectable, Logger } from '@nestjs/common';
import { SChatRoom, ChatRoomDocument } from '../schemas/chat-room.schema';
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
    @InjectModel(SChatRoom.name) private chatRoomModel: Model<ChatRoomDocument>,
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

      this.activeConnectionsService.addUserToRoom({ roomId, userId });
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
      const connectionsPerParticipant =
        this.activeConnectionsService.getUserConnections(userId);

      if (connectionsPerParticipant.size === 0) {
        this.activeConnectionsService.removeUserConnection({
          userId,
          clientId: client.id,
        });

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

  async notifyChatRoomsAboutParticipantConnection({
    userId,
    nickname,
    interlocutorRoomIds,
    io,
  }: {
    userId: string;
    nickname: string;
    interlocutorRoomIds: string[];
    io: Namespace;
  }) {
    try {
      if (!interlocutorRoomIds) {
        return;
      }

      for (const roomId of interlocutorRoomIds) {
        io.to(roomId).emit(chatRoomEmitEvents.PARTICIPANT_JOINED_CHAT_APP, {
          message: strings.joinChatAppSuccess.replace(
            '${userNickname}',
            nickname,
          ),
          data: {
            userId,
            nickname,
          },
        });
      }
    } catch (error) {
      this.logger.error(error);
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

    io.to(roomId).emit(chatRoomEmitEvents.PARTICIPANT_LEFT_CHAT_APP, {
      message: strings.disconnectChatSuccess
        .replace('${chatName}', roomName || '')
        .replace('${userNickname}', nickname),
      data: { roomId: roomId, userId, nickname },
    });

    this.activeConnectionsService.removeUserFromRoom(roomId, userId);

    this.logger.log(`${nickname} ${strings.leftRoom} ${roomId}`);
  }
}
