// src/workflow/dto/update-workflow-status.dto.ts
import { IsEnum } from 'class-validator';
import { WorkflowStatus } from '../enums/workflow-status.enum';

export class UpdateWorkflowStatusDto {
  @IsEnum(WorkflowStatus)
  status: WorkflowStatus;
}
