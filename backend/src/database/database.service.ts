import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

/**
 * RequestContext carries the authenticated user identity into every query.
 * RLS policies in the database read app.current_user_id and
 * app.current_user_role — see database/migrations/V006__rls_policies.sql.
 */
export interface RequestContext {
  userId: string;
  role: 'sales' | 'manager' | 'admin' | 'auditor';
  ip?: string;
}

/**
 * DatabaseService owns the pg connection pool.
 *
 * Critical: every query that touches an RLS-protected table MUST go through
 * `withContext()`, which opens a transaction, sets the session variables RLS
 * depends on, runs the callback, then commits. Queries run outside a context
 * have no user identity and RLS will return zero rows.
 */
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool!: Pool;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    this.pool = new Pool({
      host: this.config.get<string>('DATABASE_HOST', 'localhost'),
      port: this.config.get<number>('DATABASE_PORT', 5432),
      database: this.config.get<string>('DATABASE_NAME', 'crm_leads_dev'),
      user: this.config.get<string>('DATABASE_USER', 'crm_app'),
      password: this.config.get<string>('DATABASE_PASSWORD', 'devpassword'),
      max: this.config.get<number>('DATABASE_POOL_MAX', 10),
    });

    this.pool.on('error', (err) => {
      this.logger.error('Unexpected idle client error', err);
    });

    this.logger.log('Database pool initialized');
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool?.end();
    this.logger.log('Database pool closed');
  }

  /**
   * Run a query WITHOUT user context. Use only for things that are not
   * RLS-protected: login (looking up a user by email), health checks.
   */
  async queryUnscoped<T extends QueryResultRow = QueryResultRow>(
    text: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  /**
   * Run one or more queries inside a transaction with RLS session context set.
   * The callback receives a PoolClient bound to that transaction.
   *
   * Usage:
   *   const rows = await db.withContext(ctx, async (client) => {
   *     const r = await client.query('SELECT * FROM leads');
   *     return r.rows;
   *   });
   */
  async withContext<T>(
    ctx: RequestContext,
    callback: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // These SET LOCAL values are read by current_user_id() and
      // current_user_role() in the database. They last only for this
      // transaction. set_config(..., true) = transaction-local.
      await client.query('SELECT set_config($1, $2, true)', [
        'app.current_user_id',
        ctx.userId,
      ]);
      await client.query('SELECT set_config($1, $2, true)', [
        'app.current_user_role',
        ctx.role,
      ]);

      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /** Convenience: single scoped query returning rows. */
  async query<T extends QueryResultRow = QueryResultRow>(
    ctx: RequestContext,
    text: string,
    params: unknown[] = [],
  ): Promise<T[]> {
    return this.withContext(ctx, async (client) => {
      const result = await client.query<T>(text, params);
      return result.rows;
    });
  }

  /** Health check used by GET /health. */
  async ping(): Promise<boolean> {
    try {
      const r = await this.pool.query('SELECT 1 AS ok');
      return r.rows[0]?.ok === 1;
    } catch {
      return false;
    }
  }
}
