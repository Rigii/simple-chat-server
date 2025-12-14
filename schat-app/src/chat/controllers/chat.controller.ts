import { Controller, Post, Body } from '@nestjs/common';
import { CHAT_ROUTES } from '../constants/chat.routes';
import { MessageService } from '../services/message.service';
import { GetRoomMessagesDto } from '../dto/room-message.dto';
import { ChatDetailsService } from '../services/chat-details.service';
import { strings } from '../strings';
import { UserService } from 'src/user/services/user.service';
import { AddParticipantToChatRoomDto } from '../dto/update-chat.dto';

@Controller(CHAT_ROUTES.chat)
export class ChatController {
  constructor(
    private readonly messageService: MessageService,
    private readonly chatDetailsService: ChatDetailsService,
    private readonly userService: UserService,
  ) {}

  @Post(CHAT_ROUTES.getChatMessages)
  create(@Body() getRoomMessagesDto: GetRoomMessagesDto) {
    return this.messageService.getRoomMessages(getRoomMessagesDto);
  }

  @Post(CHAT_ROUTES.getAllChatRooms)
  async getAllChatRooms(@Body() dto: { participantId: string }) {
    const currentParticipant = await this.userService.getCurrentUserAccountData(
      dto.participantId,
    );

    if (!currentParticipant) {
      console.error(strings.userNotFound);
      throw new Error(strings.userNotFound);
    }

    const availableRooms = await this.chatDetailsService.getAllAvailableRooms();

    const interlocutorRooms =
      await this.chatDetailsService.getInterlocutorChatRoomsFromCache(
        currentParticipant.rooms,
      );

    return { availableRooms, interlocutorRooms };
  }

  @Post(CHAT_ROUTES.getRoomDetails)
  getRoomDetails(@Body() getRoomMessagesDto: GetRoomMessagesDto) {
    return this.chatDetailsService.getRoomData(getRoomMessagesDto);
  }

  @Post(CHAT_ROUTES.joinChatRooms)
  addRooms(@Body() addChatRoomsDto: AddParticipantToChatRoomDto) {
    return this.chatDetailsService.addNewParticipantToRoom(addChatRoomsDto);
  }
}
