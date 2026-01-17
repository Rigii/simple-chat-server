import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { randomUUID } from 'crypto';
import { TUserRole } from '../types';
import { USER_ACCOUNT_COLLECTIONS } from '../constants/user.constants';

export type UserProfileDocument = HydratedDocument<SUserProfile>;

@Schema({ collection: USER_ACCOUNT_COLLECTIONS.userProfile })
export class SUserProfile {
  _id: Types.ObjectId;

  @Prop({
    type: String,
    unique: true,
    index: true,
    default: () => randomUUID(),
  })
  public_id: string;

  @Prop({
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    index: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
  })
  email: string;

  @Prop()
  nickname: string;

  @Prop({ default: [] })
  rooms: string[];

  @Prop({ default: 'user' })
  role: TUserRole;
}

export const UserProfileSchema = SchemaFactory.createForClass(SUserProfile);
