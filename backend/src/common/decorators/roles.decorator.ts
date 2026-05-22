import { SetMetadata } from '@nestjs/common';

export type UserRole = 'sales' | 'manager' | 'admin' | 'auditor';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route to specific roles. Enforced by RolesGuard.
 * RLS still applies on top of this — Roles is a coarse gate, RLS is row-level.
 *
 * Usage:
 *   @Roles('admin')
 *   @Get('agency-suggestions')
 *   listSuggestions() { ... }
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
