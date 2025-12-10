export class PostRoomMessageDto {
  chatRoomId: string;
  message: string;
  participantId: string;
  nickname: string;
}

export class GetRoomMessagesDto {
  chatRoomId: string;
  userId: string;
  chunkLimit?: number;
}
