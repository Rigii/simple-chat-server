import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TUserRole } from '../types';

export type UserProfileDocument = HydratedDocument<UserProfile>;

@Schema({ collection: 'user_profile' })
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
