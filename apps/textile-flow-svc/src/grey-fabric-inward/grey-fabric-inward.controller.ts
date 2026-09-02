import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
} from '@nestjs/common';
import {
  CreateGreyFabricInwardSchema,
  type CreateGreyFabricInwardDto,
} from '@textile-flow/shared';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import { GreyFabricInwardService } from './grey-fabric-inward.service';

interface AuthRequest extends Request {
  user?: { email?: string; sub?: string };
}

@Controller('grey-fabric-inward')
export class GreyFabricInwardController {
  constructor(private readonly service: GreyFabricInwardService) {}

  @Post()
  create(
    @Body(new ZodValidationPipe(CreateGreyFabricInwardSchema))
    dto: CreateGreyFabricInwardDto,
    @Req() req: AuthRequest,
  ) {
    const performingUser = req.user?.email ?? req.user?.sub ?? 'system';
    return this.service.create(dto, performingUser);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}
