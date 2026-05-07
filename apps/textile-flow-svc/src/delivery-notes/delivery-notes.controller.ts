import { Controller, Get } from '@nestjs/common';
import { DeliveryNotesService } from './delivery-notes.service';

@Controller('delivery-notes')
export class DeliveryNotesController {
  constructor(private readonly deliveryNotesService: DeliveryNotesService) {}

  @Get()
  findAll() {
    return this.deliveryNotesService.findAll();
  }
}
