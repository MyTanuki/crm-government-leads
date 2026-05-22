import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequestContext } from '../../database/database.service';

interface JwtPayload {
  sub: string; // user id
  role: 'sales' | 'manager' | 'admin' | 'auditor';
  email: string;
}

/**
 * Validates the Bearer token and attaches a RequestContext to the request.
 * Routes marked @Public() skip this guard.
 *
 * The RequestContext is what every controller passes to DatabaseService so
 * RLS can scope rows to the authenticated user.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    try {
      const payload = await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });

      const ctx: RequestContext = {
        userId: payload.sub,
        role: payload.role,
        ip: request.ip,
      };
      request.userContext = ctx;
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: { headers: Record<string, string> }): string | null {
    const auth = request.headers['authorization'];
    if (!auth) return null;
    const [type, token] = auth.split(' ');
    return type === 'Bearer' && token ? token : null;
  }
}
