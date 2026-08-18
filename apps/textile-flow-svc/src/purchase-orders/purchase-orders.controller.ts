import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Delete,
  Param,
  UsePipes,
  ValidationPipe,
  Req,
} from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import {
  type AuthenticatedRequest,
  resolveUser,
} from '../common/types/authenticated-request';

@Controller('purchase-orders')
export class PurchaseOrdersController {
  constructor(private readonly service: PurchaseOrdersService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  create(
    @Body() dto: CreatePurchaseOrderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.create(dto, resolveUser(req));
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      skipMissingProperties: true,
    }),
  )
  update(
    @Param('id') id: string,
    @Body() dto: UpdatePurchaseOrderDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.update(id, dto, resolveUser(req));
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.service.cancel(id, resolveUser(req));
  }
}
