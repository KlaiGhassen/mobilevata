import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VehicleDocument = HydratedDocument<Vehicle>;

@Schema({ timestamps: true, collection: 'vehicles' })
export class Vehicle {
  @Prop({ required: true, trim: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ required: true, min: 0, index: true })
  price: number;

  @Prop({ default: 'EUR' })
  currency: string;

  @Prop({ required: true, index: true })
  year: number;

  @Prop({ required: true, min: 0, index: true })
  mileage: number;

  @Prop({ required: true, index: true })
  fuelType: string;

  @Prop({ required: true, index: true })
  transmission: string;

  @Prop({ required: true, index: true })
  bodyType: string;

  @Prop()
  powerHp?: number;

  @Prop()
  powerKw?: number;

  @Prop()
  doors?: number;

  @Prop()
  seats?: number;

  @Prop()
  color?: string;

  @Prop()
  interiorColor?: string;

  @Prop({ default: 'used' })
  condition: string;

  @Prop({ default: 'Germany', index: true })
  country: string;

  @Prop()
  city?: string;

  @Prop()
  postalCode?: string;

  @Prop({ type: [String], default: [] })
  features: string[];

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [String], default: [], index: true })
  categoryTags: string[];

  @Prop({ default: false })
  hasServiceBook: boolean;

  @Prop({ default: false })
  hasWarranty: boolean;

  @Prop({ default: true })
  accidentFree: boolean;

  @Prop({ default: 'PRO', index: true })
  sellersType: string;

  @Prop()
  electricRangeKm?: number;

  @Prop()
  co2Emissions?: number;

  @Prop()
  consumption?: number;

  @Prop({ default: false })
  vatDeductible: boolean;

  @Prop({ default: true, index: true })
  published: boolean;

  @Prop()
  moderationReason?: string;

  @Prop({ default: 0 })
  views: number;

  @Prop({ type: Types.ObjectId, ref: 'Brand', required: true, index: true })
  brandId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'VehicleModel', required: true, index: true })
  modelId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  sellerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Dealer' })
  dealerId?: Types.ObjectId;
}

export const VehicleSchema = SchemaFactory.createForClass(Vehicle);
VehicleSchema.index({ title: 'text', description: 'text' });
