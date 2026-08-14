import {
  IsEnum,
  IsIn,
  IsMongoId,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination.dto';
import {
  ModerationAction,
  ReclamationCategory,
  ReclamationPriority,
  ReclamationStatus,
  ReclamationTargetType,
} from '../../../database/schemas/reclamation.schema';

export class CreateReclamationDto {
  @IsEnum(ReclamationTargetType)
  targetType: ReclamationTargetType;

  @IsMongoId()
  targetId: string;

  @IsEnum(ReclamationCategory)
  category: ReclamationCategory;

  @IsString()
  @MinLength(4)
  @MaxLength(160)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  description: string;
}

export class ListReclamationsDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(ReclamationStatus)
  status?: ReclamationStatus;

  @IsOptional()
  @IsEnum(ReclamationPriority)
  priority?: ReclamationPriority;

  @IsOptional()
  @IsEnum(ReclamationCategory)
  category?: ReclamationCategory;

  @IsOptional()
  @IsEnum(ReclamationTargetType)
  targetType?: ReclamationTargetType;

  @IsOptional()
  @IsMongoId()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  sort?: string;
}

export class UpdateReclamationDto {
  @IsOptional()
  @IsEnum(ReclamationStatus)
  status?: ReclamationStatus;

  @IsOptional()
  @IsEnum(ReclamationPriority)
  priority?: ReclamationPriority;

  @IsOptional()
  @IsMongoId()
  assigneeId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  resolutionNote?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  resolution?: string;

  @IsOptional()
  @IsIn(Object.values(ModerationAction))
  moderationAction?: ModerationAction;
}
