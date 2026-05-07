import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';

@Injectable()
export class DevAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Hardcoded user for Phase 0 development
    request.user = {
      id: 'dev-user-123',
      name: 'Developer',
      email: 'dev@textileflow.local',
      role: 'ADMIN',
    };
    return true;
  }
}
