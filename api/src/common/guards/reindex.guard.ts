import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AUTH_COOKIE, readCookie } from '../security/auth-cookie';
import { UsersRepository } from '../../modules/users/users.repository';
import { isStaffRole } from '../security/roles';

/**
 * Allows reindex when `x-reindex-secret` matches env, or caller is a live ADMIN.
 */
@Injectable()
export class ReindexGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly users: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<{
      headers: Record<string, string | undefined>;
      cookies?: Record<string, string>;
    }>();

    const expected = this.config.get<string>('REINDEX_SECRET')?.trim();
    const provided = (
      req.headers['x-reindex-secret'] ||
      req.headers['X-Reindex-Secret'] ||
      ''
    ).trim();
    if (expected && provided && provided === expected) return true;

    const header = req.headers.authorization || '';
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
    const cookieToken =
      req.cookies?.[AUTH_COOKIE] ||
      readCookie(req.headers.cookie, AUTH_COOKIE);
    const token = bearer || cookieToken;
    if (token) {
      try {
        const payload = this.jwt.verify<{ sub?: string }>(token);
        if (payload.sub) {
          const user = await this.users.findById(payload.sub);
          if (user && isStaffRole(user.role) && user.status === 'ACTIVE') {
            return true;
          }
        }
      } catch {
        /* fall through */
      }
    }

    throw new UnauthorizedException(
      'Reindex requires ADMIN session or x-reindex-secret header',
    );
  }
}
