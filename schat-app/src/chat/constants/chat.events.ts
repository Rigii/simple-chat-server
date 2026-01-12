export const chatRoomEmitEvents = {
  CLIENT_READY: 'client_ready',
  JOIN_CHAT_SUCCESS: 'join_chat_success',
  PARTICIPANT_JOINED_CHAT_APP: 'participant_joined_chat_app',
  USER_LEFT_CHAT: 'user_left_chat',
  JOIN_CHAT_ERROR: 'join_chat_error',
  ROOM_DETAILS: 'room_details',
  FIND_ROOM_RECORD_ERROR: 'find_room_record_error',
  NEW_ROOM_PARTICIPANT_ADDED: 'new_room_participant_added',
  PARTICIPANT_LEFT_CHAT_APP: 'participant_left_chat_app',
  ADD_CHAT_PARTICIPANTS_ERROR: 'add_chat_participants_error',
  USER_CHAT_ROOM_DELETED: 'user_chat_room_deleted',
};

export const socketMessageNamespaces = {
  CREATE_CHAT: 'create_chat',
  UPDATE_CHAT_OPTIONS: 'update_chat_options',
  INVITE_CHAT_PARTICIPIANTS: 'invite_chat_participiants',
  ADD_CHAT_PARTICIPIANTS: 'add_chat_participiants',
  FIND_ALL_USER_CHAT_ROOMS: 'find_all_user_chat_account',
  DELETE_CHAT_ROOM: 'delete_chat_room',
  DECLINE_CHAT: 'decline_chat',
  CHAT_ROOM_MESSAGE: 'chat_room_message',
  ACTIVE_ROOM_PARTICIPANTS: 'active_room_participants',
  ACTIVE_CHAT_PARTICIPANTS: 'active_chat_participants',
};

export const incommingEvents = {
  SUBSCRIBE_ROOM: 'subscribe_room',
  UNSUBSCRIBE_ROOM: 'unsubscribe_room',
  LEAVE_CHAT: 'leave_chat',
  CHAT_ROOM_MESSAGE: 'chat_room_message',
  HANDSHAKE: 'handshake',
};

export const roomMessageStatusEvent = {
  ROOM_MESSAGE_SENT: 'room_message_sent',
  ROOM_MESSAGE_FAILED: 'room_message_failed',
  ROOM_MESSAGE_RECEIVED: 'room_message_received',
  ROOM_MESSAGE_SEEN: 'room_message_seen',
};
