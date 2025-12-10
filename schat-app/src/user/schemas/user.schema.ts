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

  @Prop({
    required: true,
    select: false, // Don't include password in queries by default
    minlength: 6,
  })
  password: string;

  @Prop({ default: 'user' })
  role: TUserRole;
}

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);
