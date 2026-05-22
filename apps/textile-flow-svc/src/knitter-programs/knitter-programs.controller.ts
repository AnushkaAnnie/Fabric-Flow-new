import { Body, Controller, Get, Post } from '@nestjs/common';
import { KnitterProgramsService } from './knitter-programs.service';

@Controller('knitter-programs')
export class KnitterProgramsController {
  constructor(private readonly service: KnitterProgramsService) {}

  @Post()
  create(@Body() body: Parameters<KnitterProgramsService['create']>[0]) {
    return this.service.create(body);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
