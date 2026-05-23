// src/workflow/workflow.controller.ts
import { Controller, Post, Body, Patch, Param, Get, ParseIntPipe } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { UpdateWorkflowStatusDto } from './dto/update-workflow-status.dto';
import { WorkflowEventEntity } from './entities/workflow-event.entity';

@Controller('workflow')
export class WorkflowController {
  constructor(private readonly workflowService: WorkflowService) {}

  @Post()
  async create(@Body() dto: CreateWorkflowDto): Promise<WorkflowEventEntity> {
    return this.workflowService.create(dto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkflowStatusDto,
  ): Promise<WorkflowEventEntity> {
    return this.workflowService.updateStatus(id, dto.status);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<WorkflowEventEntity> {
    return this.workflowService.findOne(id);
  }
}
