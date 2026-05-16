import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UsePipes,
} from '@nestjs/common';
import { YarnLotsService } from './yarn-lots.service';
import {
  CreateYarnLotSchema,
  UpdateYarnLotSchema,
  IssueYarnSchema,
  type CreateYarnLotDto,
  type UpdateYarnLotDto,
  type IssueYarnDto,
} from '@textile-flow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('yarn-lots')
export class YarnLotsController {
  constructor(private readonly yarnLotsService: YarnLotsService) {}

  @Post()
  @UsePipes(new ZodValidationPipe(CreateYarnLotSchema))
  create(@Body() dto: CreateYarnLotDto) {
    return this.yarnLotsService.create(dto);
  }

  @Get()
  findAll(
    @Query('hfCode') hfCode?: string,
    @Query('knitterId') knitterId?: string,
  ) {
    return this.yarnLotsService.findAll({
      hfCode,
      knitterId: knitterId ? parseInt(knitterId, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.yarnLotsService.findOne(id);
  }

  // FIX RC3: Changed @Put to @Patch to match frontend updateMutation
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ZodValidationPipe(UpdateYarnLotSchema)) dto: UpdateYarnLotDto,
  ) {
    return this.yarnLotsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.yarnLotsService.remove(id);
  }

  @Post(':id/issue')
  @UsePipes(new ZodValidationPipe(IssueYarnSchema))
  issue(@Param('id', ParseIntPipe) id: number, @Body() dto: IssueYarnDto) {
    return this.yarnLotsService.issue(id, dto);
  }
}
