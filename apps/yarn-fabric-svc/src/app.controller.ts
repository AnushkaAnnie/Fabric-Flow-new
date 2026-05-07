import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      service: 'yarn-fabric-svc',
      timestamp: new Date().toISOString(),
    };
  }
}
