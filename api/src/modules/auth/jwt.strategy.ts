import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { resolveJwtSecret } from '../../common/security/jwt-secret';
import { AUTH_COOKIE } from '../../common/security/auth-cookie';
import { UsersRepository } from '../users/users.repository';

function cookieOrBearer(req: Request): string | null {
  const fromCookie = req?.cookies?.[AUTH_COOKIE];
  if (typeof fromCookie === 'string' && fromCookie) return fromCookie;
  return ExtractJwt.fromAuthHeaderAsBearerToken()(req);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    private readonly users: UsersRepository,
  ) {
    super({
      jwtFromRequest: cookieOrBearer,
      ignoreExpiration: false,
      secretOrKey: resolveJwtSecret(config.get<string>('JWT_SECRET')),
    });
  }

  async validate(payload: { sub: string; email: string; role: string }) {
    const user = await this.users.findById(payload.sub);
    if (!user) throw new UnauthorizedException();
    if (user.status === 'SUSPENDED' || user.status === 'BANNED') {
      throw new UnauthorizedException('Account is not active');
    }
    return {
      userId: String(user._id),
      email: user.email,
      role: user.role,
    };
  }
}
