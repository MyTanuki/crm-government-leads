import {
  Body,
  Controller,
  Get,
  Injectable,
  Module,
  Patch,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { DatabaseService, RequestContext } from '../../database/database.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// -----------------------------------------------------------------------------
// DTO
// -----------------------------------------------------------------------------
export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  display_name?: string;
}

// -----------------------------------------------------------------------------
// Service
// -----------------------------------------------------------------------------
@Injectable()
export class UsersService {
  constructor(private readonly db: DatabaseService) {}

  async getMe(ctx: RequestContext) {
    const rows = await this.db.query(
      ctx,
      `SELECT id, email, display_name, role::text AS role,
              (line_user_id IS NOT NULL) AS line_linked,
              is_active, created_at
       FROM users WHERE id = $1`,
      [ctx.userId],
    );
    if (rows.length === 0) {
      throw new NotFoundException('User not found');
    }
    return rows[0];
  }

  async updateMe(ctx: RequestContext, dto: UpdateMeDto) {
    if (dto.display_name === undefined) {
      return this.getMe(ctx);
    }
    const rows = await this.db.query(
      ctx,
      `UPDATE users SET display_name = $1 WHERE id = $2
       RETURNING id, email, display_name, role::text AS role,
                 (line_user_id IS NOT NULL) AS line_linked,
                 is_active, created_at`,
      [dto.display_name, ctx.userId],
    );
    return rows[0];
  }

  /** This-month activity stats for the profile page. */
  async getMyStats(ctx: RequestContext) {
    const rows = await this.db.query(
      ctx,
      `SELECT
         COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW()))
           AS leads_this_month,
         COUNT(*) FILTER (WHERE status = 'qualified')
           AS qualified,
         COALESCE(SUM(budget_thb) FILTER (WHERE status NOT IN ('lost')), 0)
           AS pipeline_value
       FROM leads
       WHERE owner_id = $1 AND deleted_at IS NULL`,
      [ctx.userId],
    );
    return rows[0];
  }
}

// -----------------------------------------------------------------------------
// Controller
// -----------------------------------------------------------------------------
@ApiTags('Me')
@Controller('me')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current user' })
  getMe(@CurrentUser() ctx: RequestContext) {
    return this.users.getMe(ctx);
  }

  @Patch()
  @ApiOperation({ summary: 'Update profile fields' })
  updateMe(@CurrentUser() ctx: RequestContext, @Body() dto: UpdateMeDto) {
    return this.users.updateMe(ctx, dto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'This-month activity stats for the current user' })
  getMyStats(@CurrentUser() ctx: RequestContext) {
    return this.users.getMyStats(ctx);
  }
}

// -----------------------------------------------------------------------------
// Module
// -----------------------------------------------------------------------------
@Module({
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
