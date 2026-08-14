import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User, UserSchema } from './schemas/user.schema';
import { Dealer, DealerSchema } from './schemas/dealer.schema';
import {
  Brand,
  BrandSchema,
  VehicleModel,
  VehicleModelSchema,
} from './schemas/brand.schema';
import { Vehicle, VehicleSchema } from './schemas/vehicle.schema';
import {
  Favorite,
  FavoriteSchema,
  Comparison,
  ComparisonSchema,
} from './schemas/engagement.schema';
import {
  Conversation,
  ConversationSchema,
  ChatMessage,
  ChatMessageSchema,
} from './schemas/chat.schema';
import {
  Reclamation,
  ReclamationSchema,
} from './schemas/reclamation.schema';

export const DATABASE_MODELS = [
  { name: User.name, schema: UserSchema },
  { name: Dealer.name, schema: DealerSchema },
  { name: Brand.name, schema: BrandSchema },
  { name: VehicleModel.name, schema: VehicleModelSchema },
  { name: Vehicle.name, schema: VehicleSchema },
  { name: Favorite.name, schema: FavoriteSchema },
  { name: Comparison.name, schema: ComparisonSchema },
  { name: Conversation.name, schema: ConversationSchema },
  { name: ChatMessage.name, schema: ChatMessageSchema },
  { name: Reclamation.name, schema: ReclamationSchema },
];

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uri = config.get<string>('MONGODB_URI')?.trim();
        if (!uri) {
          throw new Error(
            'MONGODB_URI is required. Set it in api/.env (see api/.env.example).',
          );
        }
        return { uri };
      },
    }),
    MongooseModule.forFeature(DATABASE_MODELS),
  ],
  exports: [MongooseModule],
})
export class DatabaseModule {}
