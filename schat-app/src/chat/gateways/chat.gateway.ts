import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
} from '@nestjs/websockets';
import { ChatService } from '../services/chat.service';
import { Namespace, Socket } from 'socket.io';
import { UseFilters } from '@nestjs/common';
import { socketMessageNamespaces } from '../constants/chat.constants';
import { MessageService } from '../services/message.service';
import { PostRoomMessageDto } from '../dto/room-message.dto';
import { WsErrorFilter } from 'src/shared/ws-error.filter';

@WebSocketGateway({ namespace: 'chat_room' })
@UseFilters(new WsErrorFilter())
export class ChatGateway {
  constructor(
    private readonly chatService: ChatService,
    private readonly messageService: MessageService,
  ) {
    // startMonitoringActiveUsers(3000, this.activeUsers);
  }

  @WebSocketServer()
  io: Namespace; // server: Server not working. Use "Namespace" instead;
  private activeUsers = new Map<string, Set<string>>();
  async handleConnection(client: Socket) {
    const { userId, roomIds } = client.handshake.query as {
      userId: string;
      roomIds?: string;
    };
    if (!userId) {
      console.error('Invalid connection query params');
      return;
    }

    this.chatService.addInterlocutorToActiveUsers({
      clientId: client.id,
      userId,
      activeUsers: this.activeUsers,
    });

    /* Join user to the chatroom only if he's entered the chat room on the frontend */
    if (roomIds) {
      this.chatService.handleJoinSingleUserChatRoom({
        roomId: roomIds,
        client,
        userId,
        activeUsers: this.activeUsers,
        io: this.io,
      });
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;

    this.chatService.roomsDisconnectInterlocutor({
      clientId: client.id,
      userId,
      activeUsers: this.activeUsers,
      io: this.io,
    });
  }

  @SubscribeMessage(socketMessageNamespaces.CHAT_ROOM_MESSAGE)
  handlePostRoomMessage(client: Socket, dto: PostRoomMessageDto) {
    this.messageService.postRoomMessage({
      dto,
      client,
      activeUsers: this.activeUsers,
      io: this.io,
    });
  }
}
