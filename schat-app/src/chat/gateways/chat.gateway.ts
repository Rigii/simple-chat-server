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

@WebSocketGateway({
  namespace: CHAT_NAMESPACES.chatRoom,
})
@UseFilters(new WsErrorFilter())
export class ChatGateway {
  constructor(
    private readonly chatService: ChatService,
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
      this.activeConnectionsService.addNewClientIdToParticipiantPoolConnection({
        clientId: client.id,
        userId,
        nickname: currentUser.nickname,
      });

      this.chatService.handleJoinUserRooms({
        client,
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

      this.chatService.disconnectInterlocutor({
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
}
