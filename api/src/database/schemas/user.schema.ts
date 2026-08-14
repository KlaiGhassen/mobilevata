import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: 'users' })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop()
  phone?: string;

  @Prop({
    default: 'USER',
    enum: ['USER', 'DEALER', 'ADMIN', 'SUPER_ADMIN'],
  })
  role: string;

  @Prop({ default: 'ACTIVE', enum: ['ACTIVE', 'SUSPENDED', 'BANNED'], index: true })
  status: string;

  @Prop()
  moderationReason?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
