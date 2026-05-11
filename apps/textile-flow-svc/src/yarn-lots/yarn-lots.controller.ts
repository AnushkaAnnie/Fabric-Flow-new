import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';
import { YarnLotsService } from './yarn-lots.service';
import * as Shared from '@textile-flow/shared';

@Controller('yarn-lots')
export class YarnLotsController {
  constructor(private readonly yarnLotsService: YarnLotsService) {}

  @Post()
  create(@Body() dto: Shared.CreateYarnLotDto) {
    return this.yarnLotsService.create(dto);
  }

  @Get()
  findAll() {
    return this.yarnLotsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.yarnLotsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: Shared.UpdateYarnLotDto) {
    return this.yarnLotsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.yarnLotsService.remove(id);
  }

  @Post(':id/issue')
  issue(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Shared.IssueYarnDto,
  ) {
    return this.yarnLotsService.issue(id, dto);
  }
}
