import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';

type DevRequest = Request & {
  user?: {
    id: string;
    role: string;
  };
};

@Injectable()
export class DevAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<DevRequest>();
    request.user = {
      id: 'dev-user-001',
      role: 'admin',
    };
    return true;
  }
}
