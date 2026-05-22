import {
  Body,
  Controller,
  Delete,
  Injectable,
  Module,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  HttpCode,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DatabaseService, RequestContext } from '../../database/database.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ContactInputDto } from '../leads/leads.dto';

// -----------------------------------------------------------------------------
// Service
// -----------------------------------------------------------------------------
@Injectable()
export class ContactsService {
  constructor(private readonly db: DatabaseService) {}

  async add(ctx: RequestContext, leadId: string, dto: ContactInputDto) {
    return this.db.withContext(ctx, async (client) => {
      // Verify the lead exists and is visible (RLS enforces ownership)
      const lead = await client.query(
        `SELECT id FROM leads WHERE id = $1 AND deleted_at IS NULL`,
        [leadId],
      );
      if (lead.rows.length === 0) {
        throw new NotFoundException(`Lead ${leadId} not found`);
      }

      // If this contact is primary, demote any existing primary first
      if (dto.is_primary) {
        await client.query(
          `UPDATE contacts SET is_primary = FALSE
           WHERE lead_id = $1 AND is_primary = TRUE`,
          [leadId],
        );
      }

      const result = await client.query(
        `INSERT INTO contacts (lead_id, name, role_title, email, mobile, is_primary)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, lead_id, name, role_title, email, mobile,
                   is_primary, created_at`,
        [
          leadId,
          dto.name,
          dto.role_title ?? null,
          dto.email ?? null,
          dto.mobile ?? null,
          dto.is_primary ?? false,
        ],
      );

      await client.query(
        `SELECT log_audit('lead'::audit_entity_type, $1, 'contact_added',
                 $2, $3, NULL, NULL, NULL, $4::inet)`,
        [leadId, ctx.userId, `Contact added: ${dto.name}`, ctx.ip ?? null],
      );

      return result.rows[0];
    });
  }

  async update(
    ctx: RequestContext,
    leadId: string,
    contactId: string,
    dto: ContactInputDto,
  ) {
    return this.db.withContext(ctx, async (client) => {
      const existing = await client.query(
        `SELECT id FROM contacts WHERE id = $1 AND lead_id = $2`,
        [contactId, leadId],
      );
      if (existing.rows.length === 0) {
        throw new NotFoundException(`Contact ${contactId} not found`);
      }

      if (dto.is_primary) {
        await client.query(
          `UPDATE contacts SET is_primary = FALSE
           WHERE lead_id = $1 AND is_primary = TRUE AND id <> $2`,
          [leadId, contactId],
        );
      }

      const result = await client.query(
        `UPDATE contacts
         SET name = $1, role_title = $2, email = $3, mobile = $4, is_primary = $5
         WHERE id = $6
         RETURNING id, lead_id, name, role_title, email, mobile,
                   is_primary, created_at`,
        [
          dto.name,
          dto.role_title ?? null,
          dto.email ?? null,
          dto.mobile ?? null,
          dto.is_primary ?? false,
          contactId,
        ],
      );
      return result.rows[0];
    });
  }

  async remove(ctx: RequestContext, leadId: string, contactId: string): Promise<void> {
    await this.db.withContext(ctx, async (client) => {
      const result = await client.query(
        `DELETE FROM contacts WHERE id = $1 AND lead_id = $2 RETURNING name`,
        [contactId, leadId],
      );
      if (result.rows.length === 0) {
        throw new NotFoundException(`Contact ${contactId} not found`);
      }
      await client.query(
        `SELECT log_audit('lead'::audit_entity_type, $1, 'contact_removed',
                 $2, $3, NULL, NULL, NULL, $4::inet)`,
        [
          leadId,
          ctx.userId,
          `Contact removed: ${result.rows[0].name}`,
          ctx.ip ?? null,
        ],
      );
    });
  }
}

// -----------------------------------------------------------------------------
// Controller — nested under /leads/:leadId/contacts
// -----------------------------------------------------------------------------
@ApiTags('Contacts')
@Controller('leads/:leadId/contacts')
export class ContactsController {
  constructor(private readonly contacts: ContactsService) {}

  @Post()
  @HttpCode(201)
  @ApiOperation({ summary: 'Add a contact point to a lead' })
  add(
    @CurrentUser() ctx: RequestContext,
    @Param('leadId', ParseUUIDPipe) leadId: string,
    @Body() dto: ContactInputDto,
  ) {
    return this.contacts.add(ctx, leadId, dto);
  }

  @Patch(':contactId')
  @ApiOperation({ summary: 'Update a contact' })
  update(
    @CurrentUser() ctx: RequestContext,
    @Param('leadId', ParseUUIDPipe) leadId: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @Body() dto: ContactInputDto,
  ) {
    return this.contacts.update(ctx, leadId, contactId, dto);
  }

  @Delete(':contactId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove a contact' })
  async remove(
    @CurrentUser() ctx: RequestContext,
    @Param('leadId', ParseUUIDPipe) leadId: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
  ): Promise<void> {
    await this.contacts.remove(ctx, leadId, contactId);
  }
}

// -----------------------------------------------------------------------------
// Module
// -----------------------------------------------------------------------------
@Module({
  controllers: [ContactsController],
  providers: [ContactsService],
})
export class ContactsModule {}
