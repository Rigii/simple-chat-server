import { UseFilters } from '@nestjs/common';
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { WsErrorFilter } from 'shared/ws-error.filter';

@WebSocketGateway({ namespace: 'chat_room' })
// @UseGuards(AuthGuard('jwt'))
@UseFilters(new WsErrorFilter())
export class ChatGateway {
  constructor(
    private readonly chatService: ChatService,
    private readonly messageService: MessageService,
  ) {
    // startMonitoringActiveUsers(3000, this.activeUsers);
  }
}
