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
import { strings } from '../strings';
import { UserService } from 'src/user/services/user.service';

@WebSocketGateway({
  namespace: CHAT_NAMESPACES.chatRoom,
})
@UseFilters(new WsErrorFilter())
export class ChatGateway {
  constructor(
    private readonly chatService: ChatService,
    private readonly messageService: MessageService,
    private readonly userService: UserService,
  ) {}

  @WebSocketServer()
  io: Namespace;

  async handleConnection(client: Socket) {
    try {
      const userId = client.handshake.query.userId as string;

      const currentUser =
        await this.userService.getCurrentUserAccountData(userId);

      if (!userId || !currentUser) {
        console.error(strings.invalidUserId, userId);
        client.disconnect();
        throw new Error(
          strings.userWithIdNotFound.replace('${userId}', userId),
        );
      }

      this.chatService.addIdToExistingInterlocutorConnection({
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
      throw error;
    }
  }

  async handleDisconnect(client: Socket) {
    const userId = client.handshake.query.userId as string;
    const currentUser =
      await this.userService.getCurrentUserAccountData(userId);

    if (!userId || !currentUser) {
      console.error(strings.invalidUserId, userId);
      client.disconnect();
      throw new Error(strings.userWithIdNotFound.replace('${userId}', userId));
    }

    this.chatService.disconnectInterlocutor({
      client,
      nickname: currentUser.nickname,
      userId,
      interlocutorRoomIds: currentUser.rooms,
      io: this.io,
    });
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
