import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReclamationDocument = HydratedDocument<Reclamation>;

export enum ReclamationStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  REJECTED = 'REJECTED',
}

export enum ReclamationPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ReclamationTargetType {
  VEHICLE = 'VEHICLE',
  USER = 'USER',
  DEALER = 'DEALER',
  OTHER = 'OTHER',
}

export enum ReclamationCategory {
  SCAM = 'SCAM',
  MISLEADING = 'MISLEADING',
  INAPPROPRIATE = 'INAPPROPRIATE',
  SPAM = 'SPAM',
  COPYRIGHT = 'COPYRIGHT',
  FRAUD = 'FRAUD',
  TECHNICAL = 'TECHNICAL',
  OTHER = 'OTHER',
}

export enum ModerationAction {
  NONE = 'NONE',
  WARNING = 'WARNING',
  UNPUBLISH_VEHICLE = 'UNPUBLISH_VEHICLE',
  DELETE_VEHICLE = 'DELETE_VEHICLE',
  SUSPEND_USER = 'SUSPEND_USER',
  BAN_USER = 'BAN_USER',
  DELETE_USER = 'DELETE_USER',
  DELETE_DEALER = 'DELETE_DEALER',
}

@Schema({ timestamps: true, collection: 'reclamations' })
export class Reclamation {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  reporterId: Types.ObjectId;

  @Prop({
    type: String,
    enum: Object.values(ReclamationTargetType),
    required: true,
    index: true,
  })
  targetType: ReclamationTargetType;

  @Prop({ required: true, index: true })
  targetId: string;

  @Prop({
    type: String,
    enum: Object.values(ReclamationCategory),
    default: ReclamationCategory.OTHER,
    index: true,
  })
  category: ReclamationCategory;

  @Prop({ required: true, trim: true, maxlength: 160 })
  title: string;

  @Prop({ required: true, trim: true, maxlength: 5000 })
  description: string;

  @Prop({
    type: String,
    enum: Object.values(ReclamationStatus),
    default: ReclamationStatus.OPEN,
    index: true,
  })
  status: ReclamationStatus;

  @Prop({
    type: String,
    enum: Object.values(ReclamationPriority),
    default: ReclamationPriority.MEDIUM,
    index: true,
  })
  priority: ReclamationPriority;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  assigneeId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  resolvedBy?: Types.ObjectId;

  @Prop()
  resolvedAt?: Date;

  @Prop({ trim: true })
  resolutionNote?: string;

  @Prop({ trim: true })
  resolution?: string;

  @Prop({
    type: String,
    enum: Object.values(ModerationAction),
    default: ModerationAction.NONE,
  })
  moderationAction: ModerationAction;
}

export const ReclamationSchema = SchemaFactory.createForClass(Reclamation);
ReclamationSchema.index({ reporterId: 1, createdAt: -1 });
