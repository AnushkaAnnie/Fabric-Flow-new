import {
  Body,
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { KnitterProgramsService } from './knitter-programs.service';
import {
  type AuthenticatedRequest,
  resolveUser,
} from '../common/types/authenticated-request';

@Controller('knitter-programs')
export class KnitterProgramsController {
  constructor(private readonly service: KnitterProgramsService) {}

  @Post()
  create(
    @Body() body: Parameters<KnitterProgramsService['create']>[0],
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.create(body, resolveUser(req));
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.remove(id, resolveUser(req));
  }
}
