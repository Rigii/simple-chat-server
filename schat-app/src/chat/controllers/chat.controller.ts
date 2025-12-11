import { Controller, Post, Body } from '@nestjs/common';
import { CHAT_ROUTES } from '../constants/chat.routes';
import { MessageService } from '../services/message.service';
import { GetRoomMessagesDto } from '../dto/room-message.dto';
import { ChatDetailsService } from '../services/chat-details.service';

@Controller(CHAT_ROUTES.chat)
export class ChatController {
  constructor(
    private readonly messageService: MessageService,
    private readonly chatDetailsService: ChatDetailsService,
  ) {}

  @Post(CHAT_ROUTES.getChatMessages)
  create(@Body() getRoomMessagesDto: GetRoomMessagesDto) {
    return this.messageService.getRoomMessages(getRoomMessagesDto);
  }

  @Post(CHAT_ROUTES.getAllChatRooms)
  getAllChatRooms() {
    return this.chatDetailsService.getAllChatRoomsFromCache();
  }

  @Post(CHAT_ROUTES.getRoomDetails)
  getRoomDetails(@Body() getRoomMessagesDto: GetRoomMessagesDto) {
    return this.chatDetailsService.getRoomData(getRoomMessagesDto);
  }
}
