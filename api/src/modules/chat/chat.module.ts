import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { VehiclesRepository } from '../vehicles/vehicles.repository';
import { UsersRepository } from '../users/users.repository';
import { resolveJwtSecret } from '../../common/security/jwt-secret';

@Module({
  imports: [
    DatabaseModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: resolveJwtSecret(config.get<string>('JWT_SECRET')),
      }),
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, VehiclesRepository, UsersRepository],
  exports: [ChatService],
})
export class ChatModule {}
