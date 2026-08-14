import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FavoriteDocument = HydratedDocument<Favorite>;

@Schema({ timestamps: true, collection: 'favorites' })
export class Favorite {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Vehicle', required: true, index: true })
  vehicleId: Types.ObjectId;
}

export const FavoriteSchema = SchemaFactory.createForClass(Favorite);
FavoriteSchema.index({ userId: 1, vehicleId: 1 }, { unique: true });

export type ComparisonDocument = HydratedDocument<Comparison>;

@Schema({ timestamps: true, collection: 'comparisons' })
export class Comparison {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'Vehicle', default: [] })
  vehicleIds: Types.ObjectId[];
}

export const ComparisonSchema = SchemaFactory.createForClass(Comparison);
