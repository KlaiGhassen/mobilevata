import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

const USER_ROLES = ['USER', 'DEALER', 'ADMIN', 'SUPER_ADMIN'] as const;
const ASSIGNABLE_ROLES = ['USER', 'DEALER', 'ADMIN'] as const;
const USER_STATUSES = ['ACTIVE', 'SUSPENDED', 'BANNED'] as const;

export class ListUsersDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsIn(USER_ROLES)
  role?: string;

  @IsOptional()
  @IsIn(USER_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  sort?: string;
}

/** Super-admin only: provision a new ADMIN account. */
export class CreateAdminUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, {
    message: 'Password must include at least one letter and one number',
  })
  password: string;

  @IsString()
  @MaxLength(80)
  firstName: string;

  @IsString()
  @MaxLength(80)
  lastName: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;
}

export class UpdateAdminUserDto {
  @IsOptional()
  @IsIn(ASSIGNABLE_ROLES)
  role?: string;

  @IsOptional()
  @IsIn(USER_STATUSES)
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  moderationReason?: string;
}

export class ListAdminVehiclesDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsString()
  sellersType?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  sort?: string;
}

export class UpdateAdminVehicleDto {
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  moderationReason?: string;
}

export class ListDealersDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  verified?: boolean;

  @IsOptional()
  @IsString()
  sort?: string;
}

export class UpdateDealerDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(600)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  country?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  website?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(5)
  @Type(() => Number)
  rating?: number;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}

export class ListBrandsDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  q?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  popular?: boolean;

  @IsOptional()
  @IsIn(['name', 'popular', 'newest'])
  sort?: string;
}

export class CreateBrandDto {
  @IsString()
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsBoolean()
  popular?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string | null;
}

export class UpdateBrandDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsBoolean()
  popular?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string | null;
}
