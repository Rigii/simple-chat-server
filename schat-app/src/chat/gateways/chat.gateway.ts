import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
} from '@nestjs/websockets';
import { ChatService } from '../services/chat.service';
import { Namespace, Socket } from 'socket.io';
import { UseFilters } from '@nestjs/common';
import { socketMessageNamespaces } from '../constants/chat.events';
import { PostRoomMessageDto } from '../dto/room-message.dto';
import { WsErrorFilter } from 'shared/ws-error.filter';
import { MessageService } from '../services/message.service';
import { CHAT_NAMESPACES } from '../constants/chat.routes';

@WebSocketGateway({
  namespace: CHAT_NAMESPACES.chatRoom,
})
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

  handleConnection(client: Socket) {
    console.log('🔥 Client connected:');

    const { userId, chatId } = client.handshake.query as {
      userId: string;
      chatId?: string;
    };
    if (!userId || typeof userId !== 'string') {
      console.error('Invalid or missing userId:', userId);
      client.disconnect();
      return;
    }

    this.chatService.addInterlocutorToActiveUsers({
      clientId: client.id,
      userId,
      activeUsers: this.activeUsers,
    });

    /* Join user to the chatroom only if he's entered the chat room on the frontend */
    if (chatId) {
      this.chatService.handleJoinSingleUserDefaultChatRooms({
        roomId: chatId,
        client,
        userId,
        activeUsers: this.activeUsers,
        io: this.io,
      });
    }
  }

  handleDisconnect(client: Socket) {
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
