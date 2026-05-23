// src/workflow/workflow.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { WorkflowStatus } from './enums/workflow-status.enum';
import { WorkflowEventEntity } from './entities/workflow-event.entity';

@Injectable()
export class WorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWorkflowDto): Promise<WorkflowEventEntity> {
    const event = await this.prisma.workflowEvent.create({
      data: {
        entityId: dto.entityId,
        entityType: dto.entityType,
        status: dto.initialStatus,
      },
    });
    return new WorkflowEventEntity(event);
  }

  async updateStatus(id: number, status: WorkflowStatus): Promise<WorkflowEventEntity> {
    const event = await this.prisma.workflowEvent.update({
      where: { id },
      data: { status },
    });
    return new WorkflowEventEntity(event);
  }

  async findOne(id: number): Promise<WorkflowEventEntity> {
    const event = await this.prisma.workflowEvent.findUnique({
      where: { id },
    });
    if (!event) {
      throw new NotFoundException(`WorkflowEvent with id ${id} not found`);
    }
    return new WorkflowEventEntity(event);
  }
}
