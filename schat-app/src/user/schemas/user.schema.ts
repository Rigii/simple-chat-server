import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserProfileDocument = HydratedDocument<UserProfile>;

@Schema({ collection: 'user_profile' })
export class UserProfile {
  _id: Types.ObjectId;

  @Prop()
  email: string;

  @Prop()
  nikName: string;

  @Prop({ default: false })
  role: boolean;
}

export const UserProfileSchema = SchemaFactory.createForClass(UserProfile);
