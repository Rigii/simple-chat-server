import { PartialType } from '@nestjs/mapped-types';
import { CreateChatDto } from './create-chat.dto';
import { IsNotEmpty } from 'class-validator';

export class UpdateChatDto extends PartialType(CreateChatDto) {}

export class AddParticipantToChatRoomDto {
  @IsNotEmpty()
  userId: string;
  @IsNotEmpty()
  roomId: string;
}
