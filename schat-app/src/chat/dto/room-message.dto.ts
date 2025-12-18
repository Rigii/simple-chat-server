import { IsNotEmpty } from 'class-validator';

export class PostRoomMessageDto {
  @IsNotEmpty()
  chatRoomId: string;
  @IsNotEmpty()
  message: string;
  @IsNotEmpty()
  participantId: string;
  @IsNotEmpty()
  nickname: string;
}

export class GetRoomDataDto {
  @IsNotEmpty()
  chatRoomId: string;
  @IsNotEmpty()
  userId: string;
  chunkLimit?: number;
}
