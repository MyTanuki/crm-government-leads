import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AgenciesService } from './agencies.service';
import {
  AgencySearchQueryDto,
  SuggestAgencyDto,
} from './agencies.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestContext } from '../../database/database.service';

@ApiTags('Agencies')
@Controller('agencies')
export class AgenciesController {
  constructor(private readonly agencies: AgenciesService) {}

  @Get('search')
  @ApiOperation({ summary: 'Smart search across agency master data' })
  async search(
    @CurrentUser() ctx: RequestContext,
    @Query() query: AgencySearchQueryDto,
  ) {
    const started = Date.now();
    const results = await this.agencies.search(
      ctx,
      query.q,
      query.limit ?? 8,
    );
    return { results, took_ms: Date.now() - started };
  }

  @Post('suggest')
  @HttpCode(201)
  @ApiOperation({ summary: 'Suggest a new agency for Admin review' })
  suggest(
    @CurrentUser() ctx: RequestContext,
    @Body() dto: SuggestAgencyDto,
  ) {
    return this.agencies.suggest(ctx, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full agency record by id' })
  findOne(
    @CurrentUser() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.agencies.findById(ctx, id);
  }
}
