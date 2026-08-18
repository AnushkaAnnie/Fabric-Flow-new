import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';
import { Public } from './public.decorator';

type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    email?: string;
    role: string;
  };
};

@Controller('auth')
export class AuthController {
  /**
   * Public endpoint — bypasses JwtAuthGuard. Always returns { user: null }.
   * Unauthenticated clients can call this safely; the frontend reads the
   * Supabase session directly via getSupabaseSession() rather than this endpoint.
   */
  @Public()
  @Get('me')
  me(@Req() request: AuthenticatedRequest) {
    return {
      user: request.user ?? null,
    };
  }
}
