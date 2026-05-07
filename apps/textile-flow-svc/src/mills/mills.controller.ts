import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  UsePipes,
} from '@nestjs/common';
import { MillsService } from './mills.service';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CreateMillSchema, UpdateMillSchema } from '@textile-flow/shared';

@Controller('mills')
export class MillsController {
  constructor(private readonly millsService: MillsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateMillSchema))
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: any) {
    return this.millsService.create(dto);
  }

  @Get()
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.millsService.findAll(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.millsService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateMillSchema)) dto: any,
  ) {
    return this.millsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.millsService.remove(id);
  }
}
