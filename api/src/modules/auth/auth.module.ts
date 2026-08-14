import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../../database/database.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UsersRepository } from '../users/users.repository';
import { DealersRepository } from '../dealers/dealers.repository';
import { AUTH_SERVICE } from '../../common/interfaces/tokens';
import { resolveJwtSecret } from '../../common/security/jwt-secret';

@Module({
  imports: [
    DatabaseModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: resolveJwtSecret(config.get<string>('JWT_SECRET')),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    UsersRepository,
    DealersRepository,
    { provide: AUTH_SERVICE, useExisting: AuthService },
  ],
  exports: [AuthService, AUTH_SERVICE, JwtModule],
})
export class AuthModule {}
