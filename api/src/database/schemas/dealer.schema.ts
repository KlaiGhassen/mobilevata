import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DealerDocument = HydratedDocument<Dealer>;

@Schema({ timestamps: true, collection: 'dealers' })
export class Dealer {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop({ default: 'Germany' })
  country: string;

  @Prop()
  postalCode?: string;

  @Prop()
  phone?: string;

  @Prop()
  website?: string;

  @Prop()
  logoUrl?: string;

  @Prop({ default: 4.5 })
  rating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ default: false, index: true })
  verified: boolean;
}

export const DealerSchema = SchemaFactory.createForClass(Dealer);
