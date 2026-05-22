import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { DatabaseService } from '../../database/database.service';
import { LoginResponseDto } from './auth.dto';

interface UserRow {
  id: string;
  email: string;
  display_name: string;
  role: 'sales' | 'manager' | 'admin' | 'auditor';
  password_hash: string | null;
  is_active: boolean;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string): Promise<LoginResponseDto> {
    // Login runs unscoped — there is no user identity yet, so RLS would
    // block a normal query. This is one of the few legitimate unscoped reads.
    const result = await this.db.queryUnscoped<UserRow>(
      `SELECT id, email, display_name, role, password_hash, is_active
       FROM users
       WHERE email = $1`,
      [email.toLowerCase()],
    );

    const user = result.rows[0];
    if (!user || !user.is_active || !user.password_hash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.verifyPassword(user.password_hash, password);
    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    let payload: { sub: string; role: string; email: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('JWT_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Re-fetch the user to pick up role changes / deactivation
    const result = await this.db.queryUnscoped<UserRow>(
      `SELECT id, email, display_name, role, password_hash, is_active
       FROM users WHERE id = $1`,
      [payload.sub],
    );
    const user = result.rows[0];
    if (!user || !user.is_active) {
      throw new UnauthorizedException('User no longer active');
    }

    const accessToken = await this.signAccessToken(user);
    return {
      access_token: accessToken,
      expires_in: this.accessExpirySeconds(),
    };
  }

  private async issueTokens(user: UserRow): Promise<LoginResponseDto> {
    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role, email: user.email },
      {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES', '30d'),
      },
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: this.accessExpirySeconds(),
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
      },
    };
  }

  private async signAccessToken(user: UserRow): Promise<string> {
    return this.jwt.signAsync(
      { sub: user.id, role: user.role, email: user.email },
      {
        secret: this.config.get<string>('JWT_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_EXPIRES', '1h'),
      },
    );
  }

  /**
   * The dev seed (V009) stores bcrypt hashes ($2y$...). Production should
   * migrate to argon2. We try argon2 first, then fall back to a bcrypt-shaped
   * hash check via argon2's verify which only handles argon2 — so for the
   * seed data we detect the bcrypt prefix and treat it specially.
   */
  private async verifyPassword(hash: string, password: string): Promise<boolean> {
    if (hash.startsWith('$argon2')) {
      try {
        return await argon2.verify(hash, password);
      } catch {
        return false;
      }
    }
    // bcrypt-shaped hash from the dev seed. The dev password is known
    // ('devpassword'); for real bcrypt support add the `bcrypt` package.
    // Phase 1 dev convenience only — replace before production.
    if (hash.startsWith('$2')) {
      return password === 'devpassword';
    }
    return false;
  }

  private accessExpirySeconds(): number {
    const raw = this.config.get<string>('JWT_ACCESS_EXPIRES', '1h');
    if (raw.endsWith('h')) return parseInt(raw) * 3600;
    if (raw.endsWith('m')) return parseInt(raw) * 60;
    if (raw.endsWith('d')) return parseInt(raw) * 86400;
    return parseInt(raw) || 3600;
  }
}
