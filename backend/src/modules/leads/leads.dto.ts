import {
  IsUUID,
  IsString,
  IsInt,
  IsDateString,
  IsEnum,
  IsOptional,
  IsEmail,
  Min,
  Max,
  MinLength,
  MaxLength,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum CustomerControl {
  NO_CONTACT = 'no_contact',
  KNOW_CONTACT = 'know_contact',
  REACH_USER = 'reach_user',
  REACH_DECISION_MAKER = 'reach_decision_maker',
}

export enum LeadStatus {
  DRAFT = 'draft',
  QUALIFIED = 'qualified',
  PENDING_REVIEW = 'pending_review',
  BLOCKED = 'blocked',
  CONVERTED = 'converted',
  LOST = 'lost',
}

export class ContactInputDto {
  @ApiProperty({ minLength: 2, maxLength: 120 })
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  role_title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Matches(/^[0-9+\-\s()]{6,20}$/, { message: 'mobile has invalid format' })
  mobile?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  is_primary?: boolean;
}

export class CreateLeadDto {
  @ApiProperty()
  @IsUUID()
  agency_id!: string;

  @ApiProperty({ minLength: 10, maxLength: 200 })
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  project_name!: string;

  @ApiProperty({ minimum: 1, maximum: 9999999999 })
  @IsInt()
  @Min(1)
  @Max(9999999999)
  budget_thb!: number;

  @ApiProperty({ example: '2026-12-31' })
  @IsDateString()
  submission_date!: string;

  @ApiProperty({ enum: CustomerControl })
  @IsEnum(CustomerControl)
  customer_control!: CustomerControl;

  @ApiProperty({ type: ContactInputDto })
  @ValidateNested()
  @Type(() => ContactInputDto)
  primary_contact!: ContactInputDto;
}

export class UpdateLeadDto {
  @ApiPropertyOptional({ minLength: 10, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  project_name?: string;

  @ApiPropertyOptional({ minimum: 1, maximum: 9999999999 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9999999999)
  budget_thb?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  submission_date?: string;

  @ApiPropertyOptional({ enum: CustomerControl })
  @IsOptional()
  @IsEnum(CustomerControl)
  customer_control?: CustomerControl;
}

export class ListLeadsQueryDto {
  @ApiPropertyOptional({ enum: LeadStatus })
  @IsOptional()
  @IsEnum(LeadStatus)
  status?: LeadStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  agency_id?: string;

  @ApiPropertyOptional({ description: 'Free-text search on project / agency' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 25, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  page_size?: number = 25;

  @ApiPropertyOptional({
    enum: [
      'created_at',
      '-created_at',
      'submission_date',
      '-submission_date',
      'budget_thb',
      '-budget_thb',
    ],
    default: '-created_at',
  })
  @IsOptional()
  @IsString()
  sort?: string = '-created_at';
}
