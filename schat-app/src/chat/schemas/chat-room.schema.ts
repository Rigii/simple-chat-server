import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { CHAT_DB_COLLECTIONS } from '../constants/chat.constants';
import { UserProfile } from 'src/user/schemas/user.schema';

export type ChatRoomDocument = HydratedDocument<ChatRoom>;

@Schema({
  collection: CHAT_DB_COLLECTIONS.chatRoomProfile,
  timestamps: { createdAt: 'created', updatedAt: 'updated' },
})
export class ChatRoom {
  _id: string;

  @Prop({ required: true })
  chat_name: string;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user_profile' }],
  })
  participants: UserProfile[];

  created: Date;
  updated: Date;
}

export const ChatRoomSchema = SchemaFactory.createForClass(ChatRoom);
