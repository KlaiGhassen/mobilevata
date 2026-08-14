import {
  IsArray,
  IsBoolean,
  IsEmail,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';

export class RegisterDto {
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
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

export class CreateVehicleDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  price: number;

  @IsInt()
  @Type(() => Number)
  year: number;

  @IsInt()
  @Min(0)
  @Type(() => Number)
  mileage: number;

  @IsString()
  fuelType: string;

  @IsString()
  transmission: string;

  @IsString()
  bodyType: string;

  @IsString()
  brandId: string;

  @IsString()
  modelId: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  powerHp?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  powerKw?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  doors?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  seats?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  interiorColor?: string;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsArray()
  features?: string[];

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsArray()
  categoryTags?: string[];

  @IsOptional()
  @IsBoolean()
  hasServiceBook?: boolean;

  @IsOptional()
  @IsBoolean()
  hasWarranty?: boolean;

  @IsOptional()
  @IsBoolean()
  accidentFree?: boolean;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  electricRangeKm?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  co2Emissions?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  consumption?: number;

  @IsOptional()
  @IsBoolean()
  vatDeductible?: boolean;
}

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  year?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  mileage?: number;

  @IsOptional()
  @IsString()
  fuelType?: string;

  @IsOptional()
  @IsString()
  transmission?: string;

  @IsOptional()
  @IsString()
  bodyType?: string;

  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  modelId?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  powerHp?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  powerKw?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  doors?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  seats?: number;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  interiorColor?: string;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  postalCode?: string;

  @IsOptional()
  @IsArray()
  features?: string[];

  @IsOptional()
  @IsArray()
  images?: string[];

  @IsOptional()
  @IsArray()
  categoryTags?: string[];

  @IsOptional()
  @IsBoolean()
  hasServiceBook?: boolean;

  @IsOptional()
  @IsBoolean()
  hasWarranty?: boolean;

  @IsOptional()
  @IsBoolean()
  accidentFree?: boolean;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  electricRangeKm?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  co2Emissions?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  consumption?: number;

  @IsOptional()
  @IsBoolean()
  vatDeductible?: boolean;
}

export class SearchVehiclesDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  brandId?: string;

  @IsOptional()
  @IsString()
  modelId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priceMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  priceMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  yearMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  yearMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  mileageMax?: number;

  @IsOptional()
  @IsString()
  transmission?: string;

  @IsOptional()
  @IsString()
  fuelType?: string;

  @IsOptional()
  @IsString()
  bodyType?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  condition?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsString()
  sellersType?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  sort?: string;
}
