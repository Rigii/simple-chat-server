import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TUserRole } from '../types';
import { USER_ACCOUNT_COLLECTIONS } from '../constants/user.constants';

export type UserProfileDocument = HydratedDocument<UserProfile>;

@Schema({ collection: USER_ACCOUNT_COLLECTIONS.userProfile })
export class UserProfile {
  _id: Types.ObjectId;

  @Prop()
  email: string;

  @Prop()
  nickname: string;

  @Prop({ default: 'user' })
  role: TUserRole;
}

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);
