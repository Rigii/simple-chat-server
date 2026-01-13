import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
} from '@nestjs/websockets';
import { ChatService } from '../services/chat.service';
import { Namespace, Socket } from 'socket.io';
import { UseFilters } from '@nestjs/common';
import { incommingEvents } from '../constants/chat.events';
import { PostRoomMessageDto } from '../dto/room-message.dto';
import { WsErrorFilter } from 'shared/ws-error.filter';
import { MessageService } from '../services/message.service';
import { CHAT_NAMESPACES } from '../constants/chat.routes';
import { UserService } from 'src/user/services/user.service';
import { ActiveConnectionsService } from '../services/active-connections.service';
import { ChatDetailsService } from '../services/chat-details.service';
import { strings } from '../strings';

@WebSocketGateway({
  namespace: CHAT_NAMESPACES.chatRoom,
})
@UseFilters(new WsErrorFilter())
export class ChatGateway {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatDetailsService: ChatDetailsService,
    private readonly messageService: MessageService,
    private readonly userService: UserService,
    private readonly activeConnectionsService: ActiveConnectionsService,
  ) {}

  @WebSocketServer()
  io: Namespace;

  async handleConnection(client: Socket) {
    try {
      const userId = client.handshake.query.userId as string;

      const currentUser =
        await this.userService.getCurrentUserAccountData(userId);

      /* Add clientId (device id) to the participiant connection set */
      this.activeConnectionsService.addNewClientIdToParticipiantConnectionPool({
        clientId: client.id,
        userId,
        nickname: currentUser.nickname,
      });

      this.chatService.notifyChatRoomsAboutParticipantConnection({
        userId,
        nickname: currentUser.nickname,
        interlocutorRoomIds: currentUser.rooms,
        io: this.io,
      });
    } catch (error) {
      client.disconnect();
      throw error;
    }
  }

  async handleDisconnect(client: Socket) {
    try {
      const userId = client.handshake.query.userId as string;
      const currentUser =
        await this.userService.getCurrentUserAccountData(userId);
      if (!currentUser) {
        return;
      }

      this.chatService.disconnectInterlocutorAllRooms({
        client,
        nickname: currentUser.nickname,
        userId,
        interlocutorRoomIds: currentUser.rooms,
        io: this.io,
      });
    } catch (error) {
      client.disconnect();
      throw error;
    }
  }

  @SubscribeMessage(incommingEvents.CHAT_ROOM_MESSAGE)
  handlePostRoomMessage(client: Socket, payload: PostRoomMessageDto) {
    this.messageService.postRoomMessage({
      payload,
      client,
      io: this.io,
    });
  }

  @SubscribeMessage(incommingEvents.SUBSCRIBE_ROOM)
  async handleJoinRoom(
    client: Socket,
    payload: { roomId: string },
    callback: (response: any) => void,
  ) {
    const userId = client.handshake.query.userId as string;
    const currentUser =
      await this.userService.getCurrentUserAccountData(userId);
    if (!currentUser) {
      return;
    }
    const thisRoomDetailsRecord =
      await this.chatDetailsService.getChatRoomWithCache(payload.roomId);

    if (!thisRoomDetailsRecord) {
      // Instead of emitting to client, use the callback
      callback({
        success: false,
        message: strings.roomNotFound,
      });
      return;
    }

    const activeParticipants =
      await this.activeConnectionsService.getAllParticipantsInRoomConnection(
        payload.roomId,
      );

    this.chatService.notifyChatRoomsAboutParticipantConnection({
      userId,
      nickname: currentUser.nickname,
      interlocutorRoomIds: [payload.roomId],
      io: this.io,
    });

    callback({
      success: true,
      room: thisRoomDetailsRecord,
      activeParticipants: Array.from(activeParticipants?.values()),
    });

    this.chatService.handleJoinUserRoom({
      client,
      userId,
      roomId: payload.roomId,
      nickname: currentUser.nickname,
    });
  }

  @SubscribeMessage(incommingEvents.UNSUBSCRIBE_ROOM)
  async handleLeaveRoom(client: Socket, payload: { roomId: string }) {
    const userId = client.handshake.query.userId as string;
    const currentUser =
      await this.userService.getCurrentUserAccountData(userId);
    if (!currentUser) {
      return;
    }
    this.chatService.handleLeaveUserRoom({
      client,
      userId,
      roomId: payload.roomId,
      nickname: currentUser.nickname,
      io: this.io,
    });
  }
}
