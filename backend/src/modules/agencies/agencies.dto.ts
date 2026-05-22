import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AgencySearchQueryDto {
  @ApiProperty({ description: 'Partial query in Thai or English', minLength: 2 })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  q!: string;

  @ApiPropertyOptional({ default: 8, minimum: 1, maximum: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 8;
}

export class SuggestAgencyDto {
  @ApiProperty({ minLength: 4, maxLength: 200 })
  @IsString()
  @MinLength(4)
  @MaxLength(200)
  suggested_name!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  evidence_url?: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class AgencySearchHitDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  official_name_th!: string;

  @ApiPropertyOptional()
  ministry_name?: string | null;

  @ApiProperty()
  agency_type!: string;

  @ApiPropertyOptional()
  tax_id?: string | null;

  @ApiProperty()
  past_leads_count!: number;
}
