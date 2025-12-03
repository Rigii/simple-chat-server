import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TRoomEventType } from '../types';
import { CHAT_DB_COLLECTIONS } from '../constants/constants';

export type RoomEventDocument = HydratedDocument<RoomEvent>;

@Schema({
  collection: CHAT_DB_COLLECTIONS.roomEvents,
  timestamps: { createdAt: 'created', updatedAt: 'updated' },
})
export class RoomEvent {
  _id: Types.ObjectId;

  @Prop()
  type: TRoomEventType;

  @Prop()
  nickname: string;

  @Prop()
  timestamp: Date;

  @Prop()
  text: string;

  created: Date;
  updated: Date;

  get id(): string {
    return this._id.toString();
  }
}

export const RoomEventSchema = SchemaFactory.createForClass(RoomEvent);
