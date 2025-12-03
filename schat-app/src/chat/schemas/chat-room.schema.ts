import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { CHAT_DB_COLLECTIONS } from '../constants';

export type ChatRoomDocument = HydratedDocument<ChatRoom>;

@Schema({
  collection: CHAT_DB_COLLECTIONS.chatRoomProfile,
  timestamps: { createdAt: 'created', updatedAt: 'updated' },
})
export class ChatRoom {
  _id: string;

  @Prop({ required: true })
  chat_name: string;

  created: Date;
  updated: Date;

  get id(): string {
    return this._id.toString();
  }
}

export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);
