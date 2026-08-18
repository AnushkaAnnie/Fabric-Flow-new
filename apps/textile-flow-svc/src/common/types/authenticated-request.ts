import { Request } from 'express';

/**
 * Express request type augmented with the Supabase user identity injected by
 * JwtAuthGuard. Import this in controllers that need to read the caller's user.
 */
export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email?: string;
    role: string;
  };
};

/**
 * Resolves the performing user from a request object.
 * Falls back to 'system' when auth is not available (e.g. during seeding or
 * background jobs that don't go through the HTTP guard).
 */
export function resolveUser(req: AuthenticatedRequest): string {
  return req.user?.email ?? req.user?.id ?? 'system';
}
