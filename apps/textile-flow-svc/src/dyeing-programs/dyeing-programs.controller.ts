import { Controller, Get } from '@nestjs/common';
import { DyeingProgramsService } from './dyeing-programs.service';

@Controller('dyeing-programs')
export class DyeingProgramsController {
  constructor(private readonly dyeingProgramsService: DyeingProgramsService) {}

  @Get()
  findAll() {
    return this.dyeingProgramsService.findAll();
  }
}
