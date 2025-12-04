export const chatRoomEmitEvents = {
  JOIN_CHAT_SUCCESS: 'join_chat_success',
  USER_JOINED_CHAT: 'user_joined_chat',
  USER_LEFT_CHAT: 'user_left_chat',
  JOIN_CHAT_ERROR: 'join_chat_error',
  NEW_ROOM_PARTICIPIANT_ADDED: 'new_room_participiant_added',
  PARTICIPIANT_LEFT: 'participiant_left_room',
  ADD_CHAT_PARTICIPIANTS_ERROR: 'add_chat_participiants_error',
  CHAT_ROOM_MESSAGE: 'chat_room_message',
  USER_CHAT_ROOM_DELETED: 'user_chat_room_deleted',
};

export const socketMessageNamespaces = {
  CREATE_CHAT: 'create_chat',
  UPDATE_CHAT_OPTIONS: 'update_chat_options',
  INVITE_CHAT_PARTICIPIANTS: 'invite_chat_participiants',
  ADD_CHAT_PARTICIPIANTS: 'add_chat_participiants',
  FIND_ALL_USER_CHAT_ROOMS: 'find_all_user_chat_account',
  DELETE_CHAT_ROOM: 'delete_chat_room',
  JOIN_CHAT: 'join_chat',
  DECLINE_CHAT: 'decline_chat',
  CHAT_ROOM_MESSAGE: 'chat_room_message',
  LEAVE_CHAT: 'leave_chat',
};

export const roomMessageStatusEvent = {
  ROOM_MESSAGE_SENT: 'room_message_sent',
  ROOM_MESSAGE_FAILED: 'room_message_failed',
  ROOM_MESSAGE_RECEIVED: 'room_message_received',
  ROOM_MESSAGE_SEEN: 'room_message_seen',
};
