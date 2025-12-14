export const strings = {
  joinChatSuccess: 'User ${userNickname} joined chat ${chatName}',
  leaveChatSuccess: 'User ${userNickname} left chat ${chatName}',
  disconnectChatSuccess:
    'User ${userNickname} disconnected from chat ${chatName}',
  userDisconnectingError: 'Error while disconnecting user:',
  joinChatError: 'Join chat error',
  chatRoomsNotFound: 'No chat rooms found',
  userNotFound: 'User not found',
  postChatRoomMessageError: 'Error posting chat room message',
  invalidUserId: 'Invalid or missing userId:',
  userWithIdNotFound: 'User with ID ${userId} not found',
  userHasNoMoreActiveConnections:
    'User ${nickname} (${userId}) has no more active connections',
  userHasOtherActiveConnections:
    'User ${nickname} still has ${userConnections.size} other connection(s)',
  userNotParticipantOfChatRoom:
    'User with ID ${userId} is not a participant of chat room ${roomId}',
  failedAddRoomsToUserProfile:
    'Transaktion. Failed to add rooms to the user profile. Rolled back room addition:',
};
