import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContext } from '../../database/database.service';

/**
 * Injects the RequestContext (userId, role, ip) built by JwtAuthGuard.
 *
 * Usage:
 *   @Get()
 *   list(@CurrentUser() ctx: RequestContext) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.userContext as RequestContext;
  },
);
