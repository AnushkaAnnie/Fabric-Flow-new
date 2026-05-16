import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { DyeingDispatchService } from './dyeing-dispatch.service';
import type {
  CreateDyeingDispatchDto,
  UpdateReceivedWeightDto,
} from '@textile-flow/shared';
import {
  CreateDyeingDispatchSchema,
  UpdateReceivedWeightSchema,
} from '@textile-flow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('dyeing-dispatch')
export class DyeingDispatchController {
  constructor(private readonly service: DyeingDispatchService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateDyeingDispatchSchema))
    dto: CreateDyeingDispatchDto,
  ) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Patch(':dispatchId/lines/:lineId/received-weight')
  updateReceivedWeight(
    @Param('dispatchId', ParseIntPipe) dispatchId: number,
    @Param('lineId', ParseIntPipe) lineId: number,
    @Body(new ZodValidationPipe(UpdateReceivedWeightSchema))
    dto: UpdateReceivedWeightDto,
  ) {
    return this.service.updateReceivedWeight(dispatchId, lineId, dto);
  }
}
