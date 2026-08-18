import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  ParseIntPipe,
  Req,
} from '@nestjs/common';
import { DyeingsService } from './dyeings.service';
import type { UpdateDyeingDto } from '@textile-flow/shared';
import { UpdateDyeingSchema } from '@textile-flow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  type AuthenticatedRequest,
  resolveUser,
} from '../common/types/authenticated-request';

@Controller('dyeings')
export class DyeingsController {
  constructor(private readonly service: DyeingsService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateDyeingSchema)) dto: UpdateDyeingDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.update(id, dto, resolveUser(req));
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
