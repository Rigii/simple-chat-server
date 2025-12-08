import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TRoomMessageType } from '../types';
import { CHAT_DB_COLLECTIONS } from '../constants/chat.constants';

export type RoomMessageDocument = HydratedDocument<RoomMessage>;

@Schema({
  collection: CHAT_DB_COLLECTIONS.roomMessage,
  timestamps: { createdAt: 'created', updatedAt: 'updated' },
})
export class RoomMessage {
  _id: Types.ObjectId;

  @Prop()
  type: TRoomMessageType;

  @Prop()
  nickname: string;

  @Prop()
  participantId: string;

  @Prop()
  chatRoomId: string;

  @Prop()
  text: string;

  @Prop()
  isAdmin: boolean;

  created: Date;
  updated: Date;

  get id(): string {
    return this._id.toString();
  }
}

export const RoomMessageSchema = SchemaFactory.createForClass(RoomMessage);
