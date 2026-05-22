import { Injectable, NotFoundException } from '@nestjs/common';
import { DatabaseService, RequestContext } from '../../database/database.service';
import { SuggestAgencyDto } from './agencies.dto';

export interface AgencySearchRow {
  id: string;
  official_name_th: string;
  ministry_name: string | null;
  agency_type: string;
  tax_id: string | null;
  past_leads_count: number;
}

@Injectable()
export class AgenciesService {
  constructor(private readonly db: DatabaseService) {}

  /**
   * Smart Search. Phase 1 implementation uses Postgres trigram similarity
   * with ranking signals. Production swaps this for Typesense behind the
   * same method signature (see ADR-005).
   *
   * Ranking signals, highest weight first:
   *   - exact prefix match on name or alias
   *   - trigram similarity
   *   - past-leads frequency (popular agencies float up)
   */
  async search(
    ctx: RequestContext,
    q: string,
    limit: number,
  ): Promise<AgencySearchRow[]> {
    const sql = `
      WITH matches AS (
        SELECT DISTINCT a.id
        FROM agencies a
        LEFT JOIN agency_aliases al ON al.agency_id = a.id
        WHERE a.status = 'active'
          AND (
            a.official_name_th ILIKE '%' || $1 || '%'
            OR a.short_name ILIKE '%' || $1 || '%'
            OR al.alias ILIKE '%' || $1 || '%'
            OR a.official_name_th % $1
            OR al.alias % $1
          )
      )
      SELECT
        s.id,
        s.official_name_th,
        parent.official_name_th AS ministry_name,
        s.agency_type::text     AS agency_type,
        s.tax_id,
        s.past_leads_count,
        GREATEST(
          similarity(s.official_name_th, $1),
          COALESCE(similarity(s.short_name, $1), 0)
        ) AS sim,
        (CASE WHEN s.official_name_th ILIKE $1 || '%' THEN 1 ELSE 0 END) AS prefix_hit
      FROM matches m
      JOIN agencies_with_stats s ON s.id = m.id
      LEFT JOIN agencies parent ON parent.id = s.parent_agency_id
      ORDER BY
        prefix_hit DESC,
        sim DESC,
        s.past_leads_count DESC
      LIMIT $2
    `;
    return this.db.query<AgencySearchRow>(ctx, sql, [q, limit]);
  }

  async findById(ctx: RequestContext, id: string) {
    const rows = await this.db.query(
      ctx,
      `SELECT
         s.id, s.official_name_th, s.official_name_en, s.short_name,
         s.tax_id, s.gfmis_code, s.agency_type::text AS agency_type,
         s.parent_agency_id, s.province, s.default_address,
         s.status::text AS status,
         s.past_leads_count, s.past_leads_won,
         parent.official_name_th AS ministry_name
       FROM agencies_with_stats s
       LEFT JOIN agencies parent ON parent.id = s.parent_agency_id
       WHERE s.id = $1`,
      [id],
    );
    if (rows.length === 0) {
      throw new NotFoundException(`Agency ${id} not found`);
    }
    return rows[0];
  }

  /**
   * Sales suggests a new agency. Lands in agency_suggestions with status
   * 'pending' for Admin review.
   */
  async suggest(ctx: RequestContext, dto: SuggestAgencyDto) {
    const rows = await this.db.query(
      ctx,
      `INSERT INTO agency_suggestions
         (suggested_name, evidence_url, note, status, suggested_by)
       VALUES ($1, $2, $3, 'pending', $4)
       RETURNING id, suggested_name, evidence_url, note,
                 status::text AS status, created_at`,
      [dto.suggested_name, dto.evidence_url ?? null, dto.note ?? null, ctx.userId],
    );

    // Audit
    await this.db.query(
      ctx,
      `SELECT log_audit('agency_suggestion'::audit_entity_type, $1, 'created',
               $2, $3, NULL, NULL, NULL, $4::inet)`,
      [
        rows[0].id,
        ctx.userId,
        `Agency suggestion submitted: ${dto.suggested_name}`,
        ctx.ip ?? null,
      ],
    );

    return rows[0];
  }
}
