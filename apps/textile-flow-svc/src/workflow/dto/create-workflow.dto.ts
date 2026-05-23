// src/workflow/dto/create-workflow.dto.ts
import { IsString, IsEnum } from 'class-validator';
import { WorkflowStatus } from '../enums/workflow-status.enum';

export class CreateWorkflowDto {
  @IsString()
  entityId: string;

  @IsString()
  entityType: string;

  @IsEnum(WorkflowStatus)
  initialStatus: WorkflowStatus;
}
