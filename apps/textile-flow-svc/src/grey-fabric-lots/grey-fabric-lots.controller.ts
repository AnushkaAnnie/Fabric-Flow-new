import { Controller, Get } from '@nestjs/common';
import { GreyFabricLotsService } from './grey-fabric-lots.service';

@Controller('grey-fabric-lots')
export class GreyFabricLotsController {
  constructor(private readonly greyFabricLotsService: GreyFabricLotsService) {}

  @Get()
  findAll() {
    return this.greyFabricLotsService.findAll();
  }
}
