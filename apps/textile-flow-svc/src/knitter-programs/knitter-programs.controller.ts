import { Controller, Get } from '@nestjs/common';
import { KnitterProgramsService } from './knitter-programs.service';

@Controller('knitter-programs')
export class KnitterProgramsController {
  constructor(
    private readonly knitterProgramsService: KnitterProgramsService,
  ) {}

  @Get()
  findAll() {
    return this.knitterProgramsService.findAll();
  }
}
