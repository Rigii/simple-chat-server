import { ROOM_EVENTS, ROOM_MESSAGES } from './constants/constants';

export type TRoomEventType = keyof typeof ROOM_EVENTS;
export type TRoomMessageType = keyof typeof ROOM_MESSAGES;
