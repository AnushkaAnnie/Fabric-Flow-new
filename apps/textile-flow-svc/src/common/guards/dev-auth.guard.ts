import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class DevAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = {
      id: 'dev-user-001',
      role: 'admin',
    };
    return true;
  }
}
