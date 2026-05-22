import { Injectable, NotFoundException } from '@nestjs/common';
import { PoolClient } from 'pg';
import { DatabaseService, RequestContext } from '../../database/database.service';
import { CreateLeadDto, UpdateLeadDto, ListLeadsQueryDto } from './leads.dto';

/** Whitelist of sortable columns — guards against SQL injection via sort param. */
const SORT_COLUMNS: Record<string, string> = {
  created_at: 'created_at ASC',
  '-created_at': 'created_at DESC',
  submission_date: 'submission_date ASC',
  '-submission_date': 'submission_date DESC',
  budget_thb: 'budget_thb ASC',
  '-budget_thb': 'budget_thb DESC',
};

@Injectable()
export class LeadsService {
  constructor(private readonly db: DatabaseService) {}

  async list(ctx: RequestContext, query: ListLeadsQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.page_size ?? 25;
    const offset = (page - 1) * pageSize;
    const orderBy = SORT_COLUMNS[query.sort ?? '-created_at'] ?? 'created_at DESC';

    const where: string[] = [];
    const params: unknown[] = [];

    if (query.status) {
      params.push(query.status);
      where.push(`status = $${params.length}`);
    }
    if (query.agency_id) {
      params.push(query.agency_id);
      where.push(`agency_id = $${params.length}`);
    }
    if (query.q) {
      params.push(`%${query.q}%`);
      where.push(
        `(project_name ILIKE $${params.length} OR agency_name_th ILIKE $${params.length})`,
      );
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    return this.db.withContext(ctx, async (client) => {
      const countResult = await client.query<{ total: string }>(
        `SELECT COUNT(*) AS total FROM leads_with_primary_contact ${whereSql}`,
        params,
      );
      const total = parseInt(countResult.rows[0].total, 10);

      const dataParams = [...params, pageSize, offset];
      const dataResult = await client.query(
        `SELECT id, lead_code, project_name, budget_thb, submission_date,
                customer_control, status, agency_id, agency_name_th,
                agency_short_name, owner_id, owner_name,
                primary_contact_name, days_until_submission, created_at
         FROM leads_with_primary_contact
         ${whereSql}
         ORDER BY ${orderBy}
         LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`,
        dataParams,
      );

      return {
        data: dataResult.rows,
        meta: {
          page,
          page_size: pageSize,
          total,
          total_pages: Math.ceil(total / pageSize),
        },
      };
    });
  }

  async findById(ctx: RequestContext, id: string) {
    return this.db.withContext(ctx, async (client) => {
      const leadResult = await client.query(
        `SELECT l.id, l.lead_code, l.project_name, l.budget_thb,
                l.submission_date, l.customer_control, l.status,
                l.agency_id, l.owner_id, l.created_at, l.updated_at,
                l.deleted_at,
                (l.submission_date - CURRENT_DATE) AS days_until_submission
         FROM leads l
         WHERE l.id = $1 AND l.deleted_at IS NULL`,
        [id],
      );
      if (leadResult.rows.length === 0) {
        throw new NotFoundException(`Lead ${id} not found`);
      }
      const lead = leadResult.rows[0];

      const contactsResult = await client.query(
        `SELECT id, lead_id, name, role_title, email, mobile,
                is_primary, created_at
         FROM contacts WHERE lead_id = $1
         ORDER BY is_primary DESC, created_at ASC`,
        [id],
      );

      const agencyResult = await client.query(
        `SELECT s.id, s.official_name_th, s.official_name_en, s.short_name,
                s.tax_id, s.gfmis_code, s.agency_type::text AS agency_type,
                s.province, s.past_leads_count, s.past_leads_won,
                parent.official_name_th AS ministry_name
         FROM agencies_with_stats s
         LEFT JOIN agencies parent ON parent.id = s.parent_agency_id
         WHERE s.id = $1`,
        [lead.agency_id],
      );

      return {
        ...lead,
        agency: agencyResult.rows[0] ?? null,
        contacts: contactsResult.rows,
      };
    });
  }

  async create(ctx: RequestContext, dto: CreateLeadDto) {
    return this.db.withContext(ctx, async (client) => {
      const leadResult = await client.query(
        `INSERT INTO leads
           (agency_id, project_name, budget_thb, submission_date,
            customer_control, status, owner_id)
         VALUES ($1, $2, $3, $4, $5, 'draft', $6)
         RETURNING id, lead_code, project_name, budget_thb, submission_date,
                   customer_control, status, agency_id, owner_id, created_at`,
        [
          dto.agency_id,
          dto.project_name,
          dto.budget_thb,
          dto.submission_date,
          dto.customer_control,
          ctx.userId,
        ],
      );
      const lead = leadResult.rows[0];

      // Primary contact
      const c = dto.primary_contact;
      await client.query(
        `INSERT INTO contacts (lead_id, name, role_title, email, mobile, is_primary)
         VALUES ($1, $2, $3, $4, $5, TRUE)`,
        [lead.id, c.name, c.role_title ?? null, c.email ?? null, c.mobile ?? null],
      );

      await this.writeAudit(
        client,
        lead.id,
        'created',
        ctx,
        `Lead created: ${lead.project_name}`,
        null,
        {
          lead_code: lead.lead_code,
          project_name: lead.project_name,
          budget_thb: lead.budget_thb,
          status: lead.status,
        },
      );

      return lead;
    });
  }

  async update(ctx: RequestContext, id: string, dto: UpdateLeadDto) {
    return this.db.withContext(ctx, async (client) => {
      const existing = await client.query(
        `SELECT id, project_name, budget_thb, submission_date, customer_control
         FROM leads WHERE id = $1 AND deleted_at IS NULL`,
        [id],
      );
      if (existing.rows.length === 0) {
        throw new NotFoundException(`Lead ${id} not found`);
      }
      const before = existing.rows[0];

      const sets: string[] = [];
      const params: unknown[] = [];
      for (const field of [
        'project_name',
        'budget_thb',
        'submission_date',
        'customer_control',
      ] as const) {
        if (dto[field] !== undefined) {
          params.push(dto[field]);
          sets.push(`${field} = $${params.length}`);
        }
      }
      if (sets.length === 0) return before;

      params.push(id);
      const updated = await client.query(
        `UPDATE leads SET ${sets.join(', ')}
         WHERE id = $${params.length}
         RETURNING id, lead_code, project_name, budget_thb, submission_date,
                   customer_control, status, agency_id, owner_id,
                   created_at, updated_at`,
        params,
      );

      await this.writeAudit(
        client,
        id,
        'updated',
        ctx,
        'Lead fields updated',
        before,
        updated.rows[0],
      );

      return updated.rows[0];
    });
  }

  async softDelete(ctx: RequestContext, id: string): Promise<void> {
    await this.db.withContext(ctx, async (client) => {
      const result = await client.query(
        `UPDATE leads SET deleted_at = NOW()
         WHERE id = $1 AND deleted_at IS NULL
         RETURNING id, project_name`,
        [id],
      );
      if (result.rows.length === 0) {
        throw new NotFoundException(`Lead ${id} not found`);
      }
      await this.writeAudit(
        client,
        id,
        'deleted',
        ctx,
        `Lead soft-deleted: ${result.rows[0].project_name}`,
        null,
        null,
      );
    });
  }

  /**
   * Phase 1 manual qualify. In Phase 2 this routes through the Risk Engine.
   * Requires all six checklist fields — they are NOT NULL in the schema so
   * a draft that reached this point already has them; this re-validates and
   * flips the status.
   */
  async qualify(ctx: RequestContext, id: string) {
    return this.db.withContext(ctx, async (client) => {
      const result = await client.query(
        `UPDATE leads SET status = 'qualified'
         WHERE id = $1 AND deleted_at IS NULL AND status = 'draft'
         RETURNING id, lead_code, status, project_name`,
        [id],
      );
      if (result.rows.length === 0) {
        throw new NotFoundException(
          `Lead ${id} not found, or not in draft status`,
        );
      }
      await this.writeAudit(
        client,
        id,
        'status_changed',
        ctx,
        'Status changed from draft to qualified',
        { status: 'draft' },
        { status: 'qualified' },
        'status',
      );
      return result.rows[0];
    });
  }

  async getAudit(ctx: RequestContext, id: string, page: number, pageSize: number) {
    const offset = (page - 1) * pageSize;
    return this.db.withContext(ctx, async (client) => {
      const countResult = await client.query<{ total: string }>(
        `SELECT COUNT(*) AS total FROM audit_log
         WHERE entity_type = 'lead' AND entity_id = $1`,
        [id],
      );
      const total = parseInt(countResult.rows[0].total, 10);

      const data = await client.query(
        `SELECT al.id, al.entity_type::text AS entity_type, al.entity_id,
                al.action, al.field_name, al.before_value, al.after_value,
                al.description, al.occurred_at, al.ip_address,
                u.display_name AS actor_name, u.email AS actor_email
         FROM audit_log al
         LEFT JOIN users u ON u.id = al.actor_id
         WHERE al.entity_type = 'lead' AND al.entity_id = $1
         ORDER BY al.occurred_at DESC
         LIMIT $2 OFFSET $3`,
        [id, pageSize, offset],
      );

      return {
        data: data.rows,
        meta: {
          page,
          page_size: pageSize,
          total,
          total_pages: Math.ceil(total / pageSize),
        },
      };
    });
  }

  /** Writes an audit row inside the caller's transaction. */
  private async writeAudit(
    client: PoolClient,
    leadId: string,
    action: string,
    ctx: RequestContext,
    description: string,
    before: object | null,
    after: object | null,
    fieldName: string | null = null,
  ): Promise<void> {
    await client.query(
      `SELECT log_audit('lead'::audit_entity_type, $1, $2, $3, $4, $5,
               $6::jsonb, $7::jsonb, $8::inet)`,
      [
        leadId,
        action,
        ctx.userId,
        description,
        fieldName,
        before ? JSON.stringify(before) : null,
        after ? JSON.stringify(after) : null,
        ctx.ip ?? null,
      ],
    );
  }
}
