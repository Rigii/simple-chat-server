import { Controller, Post, Body } from '@nestjs/common';
import { CHAT_ROUTES } from '../constants/chat.routes';
import { MessageService } from '../services/message.service';
import { GetRoomMessagesDto } from '../dto/room-message.dto';
import { ChatCacheService } from '../services/chat-cache.service';

@Controller(CHAT_ROUTES.chat)
export class ChatController {
  constructor(
    private readonly messageService: MessageService,
    private readonly chatCacheService: ChatCacheService,
  ) {}

  @Post(CHAT_ROUTES.getChatMessages)
  create(@Body() getRoomMessagesDto: GetRoomMessagesDto) {
    return this.messageService.getRoomMessages(getRoomMessagesDto);
  }

  @Post(CHAT_ROUTES.getAllChatRooms)
  getAllChatRooms() {
    return this.chatCacheService.getAllChatRoomsFromCache();
  }
}
