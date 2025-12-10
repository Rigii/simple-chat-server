export class PostRoomMessageDto {
  chatRoomId: string;
  message: string;
  senderId: string;
  nickname: string;
}

export class GetRoomMessagesDto {
  chatRoomId: string;
  userId: string;
  chunkLimit?: number;
}
