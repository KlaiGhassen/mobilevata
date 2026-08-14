import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BrandDocument = HydratedDocument<Brand>;

@Schema({ timestamps: true, collection: 'brands' })
export class Brand {
  @Prop({ required: true, unique: true, trim: true })
  name: string;

  @Prop()
  logoUrl?: string;

  @Prop({ default: false })
  popular: boolean;
}

export const BrandSchema = SchemaFactory.createForClass(Brand);

export type ModelDocument = HydratedDocument<VehicleModel>;

@Schema({ timestamps: true, collection: 'models' })
export class VehicleModel {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ type: Types.ObjectId, ref: 'Brand', required: true, index: true })
  brandId: Types.ObjectId;
}

export const VehicleModelSchema = SchemaFactory.createForClass(VehicleModel);
VehicleModelSchema.index({ brandId: 1, name: 1 }, { unique: true });
