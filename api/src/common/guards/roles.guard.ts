import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AUTH_COOKIE, readCookie } from '../security/auth-cookie';
import { roleSatisfies } from '../security/roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;

    const req = context.switchToHttp().getRequest<{
      user?: { role?: string };
      headers: Record<string, string | undefined>;
      cookies?: Record<string, string>;
    }>();

    if (roleSatisfies(req.user?.role, roles)) return true;

    const header = req.headers.authorization || '';
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
    const cookieToken =
      req.cookies?.[AUTH_COOKIE] ||
      readCookie(req.headers.cookie, AUTH_COOKIE);
    const token = bearer || cookieToken;
    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }
    try {
      const payload = this.jwt.verify<{ role?: string }>(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });
      if (roleSatisfies(payload.role, roles)) return true;
    } catch {
      /* fall through */
    }
    throw new UnauthorizedException('Insufficient role');
  }
}
