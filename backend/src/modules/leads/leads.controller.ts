import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto, UpdateLeadDto, ListLeadsQueryDto } from './leads.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestContext } from '../../database/database.service';

@ApiTags('Leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leads: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'List leads visible to the current user' })
  list(
    @CurrentUser() ctx: RequestContext,
    @Query() query: ListLeadsQueryDto,
  ) {
    return this.leads.list(ctx, query);
  }

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Create a new lead in draft status' })
  create(
    @CurrentUser() ctx: RequestContext,
    @Body() dto: CreateLeadDto,
  ) {
    return this.leads.create(ctx, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead detail' })
  findOne(
    @CurrentUser() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.leads.findById(ctx, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Partial update of a lead' })
  update(
    @CurrentUser() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leads.update(ctx, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Soft delete a lead' })
  async remove(
    @CurrentUser() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.leads.softDelete(ctx, id);
  }

  @Post(':id/qualify')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Mark a lead as Qualified (Phase 1 manual; Phase 2 risk engine)',
  })
  qualify(
    @CurrentUser() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.leads.qualify(ctx, id);
  }

  @Get(':id/audit')
  @ApiOperation({ summary: 'Get the audit history for a lead' })
  audit(
    @CurrentUser() ctx: RequestContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('page') page = 1,
    @Query('page_size') pageSize = 50,
  ) {
    return this.leads.getAudit(ctx, id, Number(page), Number(pageSize));
  }
}
