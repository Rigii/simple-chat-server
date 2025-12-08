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
import { strings } from '../strings';

@WebSocketGateway({
  namespace: CHAT_NAMESPACES.chatRoom,
})
@UseFilters(new WsErrorFilter())
export class ChatGateway {
  constructor(
    private readonly chatService: ChatService,
    private readonly messageService: MessageService,
  ) {}

  @WebSocketServer()
  io: Namespace;
  private activeUsers = new Map<string, Set<string>>();

  async handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;

    const currentUser =
      await this.chatService.getCurrentUserAccountData(userId);

    if (!userId || !currentUser) {
      console.error(strings.invalidUserId, userId);
      client.disconnect();
      throw new Error(strings.userWithIdNotFound.replace('${userId}', userId));
    }

    this.chatService.addInterlocutorToActiveUsers({
      clientId: client.id,
      userId,
      nickname: currentUser.nickname,
      activeUsers: this.activeUsers,
    });

    this.chatService.handleJoinUserDefaultChatRooms({
      client,
      userId,
      nickname: currentUser.nickname,
      io: this.io,
    });
  }

  async handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const currentUser =
      await this.chatService.getCurrentUserAccountData(userId);

    if (!userId || !currentUser) {
      console.error(strings.invalidUserId, userId);
      client.disconnect();
      throw new Error(strings.userWithIdNotFound.replace('${userId}', userId));
    }

    this.chatService.roomsDisconnectInterlocutor({
      client,
      nickname: currentUser.nickname,
      userId,
      activeUsers: this.activeUsers,
      io: this.io,
    });
  }

  @SubscribeMessage(socketMessageNamespaces.CHAT_ROOM_MESSAGE)
  handlePostRoomMessage(client: Socket, payload: any) {
    console.log(222222, payload.chatRoomId);
    this.messageService.postRoomMessage({
      dto: payload as PostRoomMessageDto,
      client,
      activeUsers: this.activeUsers,
      io: this.io,
    });
  }
}
