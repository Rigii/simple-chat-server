import { Controller, Post, Body, Logger } from '@nestjs/common';
import { CHAT_ROUTES } from '../constants/chat.routes';
import { MessageService } from '../services/message.service';
import { GetRoomDataDto } from '../dto/room-message.dto';
import { ChatDetailsService } from '../services/chat-details.service';
import { strings } from '../strings';
import { UserService } from 'src/user/services/user.service';
import { AddParticipantToChatRoomDto } from '../dto/update-chat.dto';

@Controller(CHAT_ROUTES.chat)
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(
    private readonly messageService: MessageService,
    private readonly chatDetailsService: ChatDetailsService,
    private readonly userService: UserService,
  ) {}

  @Post(CHAT_ROUTES.getChatMessages)
  create(@Body() GetRoomDataDto: GetRoomDataDto) {
    return this.messageService.getRoomMessages(GetRoomDataDto);
  }

  @Post(CHAT_ROUTES.getAllChatRooms)
  async getAllChatRooms(@Body() dto: { participantId: string }) {
    const currentParticipant = await this.userService.getCurrentUserAccountData(
      dto.participantId,
    );

    if (!currentParticipant) {
      this.logger.error(strings.userNotFound);
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
  getRoomDetails(@Body() GetRoomDataDto: GetRoomDataDto) {
    return this.chatDetailsService.getRoomData(GetRoomDataDto);
  }

  @Post(CHAT_ROUTES.joinChatRooms)
  addRooms(@Body() addChatRoomsDto: AddParticipantToChatRoomDto) {
    return this.chatDetailsService.addNewParticipantToRoom(addChatRoomsDto);
  }
}
