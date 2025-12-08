export class PostRoomMessageDto {
  chatRoomId: string;
  message: string;
  senderId: string;
  senderName: string;
}

export class GetRoomMessagesDto {
  chatRoomId: string;
  userId: string;
  chunkLimit?: number;
}
