import { Controller, Post, Body } from '@nestjs/common';
import { CHAT_ROUTES } from '../constants/chat.routes';
import { MessageService } from '../services/message.service';
import { GetRoomMessagesDto } from '../dto/room-message.dto';

@Controller(CHAT_ROUTES.chatRoom)
export class ChatController {
  constructor(private readonly messageService: MessageService) {}

  @Post(CHAT_ROUTES.getChatMessages)
  create(@Body() getRoomMessagesDto: GetRoomMessagesDto) {
    return this.messageService.getRoomMessages(getRoomMessagesDto);
  }
}
