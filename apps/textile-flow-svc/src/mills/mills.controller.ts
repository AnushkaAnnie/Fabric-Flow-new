import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UsePipes,
} from '@nestjs/common';
import { MillsService } from './mills.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import {
  CreateMillSchema,
  UpdateMillSchema,
  type CreateMillDto,
  type UpdateMillDto,
} from '@textile-flow/shared';

@Controller('mills')
export class MillsController {
  constructor(private readonly millsService: MillsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateMillSchema))
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateMillDto) {
    return this.millsService.create(dto);
  }

  @Get()
  findAll() {
    return this.millsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.millsService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateMillSchema)) dto: UpdateMillDto,
  ) {
    return this.millsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.millsService.remove(id);
  }
}
