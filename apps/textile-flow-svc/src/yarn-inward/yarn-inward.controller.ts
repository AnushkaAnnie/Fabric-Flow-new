import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import {
  CreateYarnInwardSchema,
  UpdateYarnInwardSchema,
  type CreateYarnInwardDto,
  type UpdateYarnInwardDto,
} from '@textile-flow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { YarnInwardService } from './yarn-inward.service';
import {
  type AuthenticatedRequest,
  resolveUser,
} from '../common/types/authenticated-request';

@Controller('yarn-inward')
export class YarnInwardController {
  constructor(private readonly service: YarnInwardService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateYarnInwardSchema))
    dto: CreateYarnInwardDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.create(dto, resolveUser(req));
  }

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
    @Body(new ZodValidationPipe(UpdateYarnInwardSchema))
    dto: UpdateYarnInwardDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.update(id, dto, resolveUser(req));
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.remove(id, resolveUser(req));
  }
}
