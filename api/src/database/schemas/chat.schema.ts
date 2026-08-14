import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ConversationDocument = HydratedDocument<Conversation>;

export enum ConversationStatus {
  PENDING = 'PENDING',
  OPEN = 'OPEN',
  DECLINED = 'DECLINED',
  CLOSED = 'CLOSED',
}

@Schema({ timestamps: true, collection: 'conversations' })
export class Conversation {
  @Prop({ type: Types.ObjectId, ref: 'Vehicle', required: true, index: true })
  vehicleId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  buyerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  sellerId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(ConversationStatus),
    default: ConversationStatus.PENDING,
    index: true,
  })
  status: ConversationStatus;

  /** Buyer's initial interest / offer note */
  @Prop({ required: true })
  offerMessage: string;

  @Prop()
  offerPrice?: number;

  @Prop()
  phone?: string;

  @Prop()
  lastMessageAt?: Date;

  @Prop()
  lastMessagePreview?: string;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
ConversationSchema.index({ vehicleId: 1, buyerId: 1 }, { unique: true });

export type ChatMessageDocument = HydratedDocument<ChatMessage>;

@Schema({ timestamps: true, collection: 'chat_messages' })
export class ChatMessage {
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true, index: true })
  conversationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  senderId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  content: string;

  @Prop({ default: false })
  read: boolean;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);
