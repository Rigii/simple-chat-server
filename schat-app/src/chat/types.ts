import { ROOM_EVENTS, ROOM_MESSAGES } from './constants/chat.constants';

export type TRoomEventType = keyof typeof ROOM_EVENTS;
export type TRoomMessageType = keyof typeof ROOM_MESSAGES;

export interface ICachedChatRoom {
  chat_name: string;
  _id: string;
  participiants: string[];
  created: Date;
  updated: Date;
}
