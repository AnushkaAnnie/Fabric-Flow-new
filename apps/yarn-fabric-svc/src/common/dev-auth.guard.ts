import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  roles: string[];
}

/**
 * DevAuthGuard - Returns a hardcoded user for local development.
 * Replace with real JWT/OAuth guard in production.
 */
@Injectable()
export class DevAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    (request as any).user = {
      id: 'dev-user-001',
      name: 'Dev User',
      email: 'dev@fabricflow.local',
      roles: ['admin'],
    } satisfies AuthenticatedUser;
    return true;
  }
}
