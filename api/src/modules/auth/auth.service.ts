import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersRepository } from '../users/users.repository';
import { DealersRepository } from '../dealers/dealers.repository';
import { LoginDto, RegisterDto } from '../vehicles/dto/search-vehicles.dto';
import { IAuthService } from '../../common/interfaces/tokens';
import { serializeEntity, toId } from '../../common/mappers/serialize';

type AuthUserDoc = {
  _id: unknown;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    private readonly users: UsersRepository,
    private readonly dealers: DealersRepository,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new UnauthorizedException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.users.create({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      role: 'USER',
    });

    return this.issueSession(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !(await bcrypt.compare(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    this.assertActive(user.status);
    return this.issueSession(user);
  }

  async me(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) throw new ForbiddenException();
    const dealer = await this.dealers.findOne({ userId: user._id });
    return {
      id: toId(user._id),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      status: user.status,
      dealer: dealer
        ? serializeEntity(dealer.toObject() as unknown as Record<string, unknown>)
        : null,
    };
  }

  /** Login / registration gate for moderated accounts. */
  private assertActive(status?: string) {
    if (status && status !== 'ACTIVE') {
      throw new UnauthorizedException(
        status === 'BANNED'
          ? 'This account has been banned'
          : 'This account is temporarily suspended',
      );
    }
  }

  /** Internal: JWT for cookie only — never returned in HTTP JSON. */
  issueSession(user: AuthUserDoc) {
    const id = toId(user._id);
    return {
      accessToken: this.jwt.sign({
        sub: id,
        email: user.email,
        role: user.role,
      }),
      user: {
        id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}
