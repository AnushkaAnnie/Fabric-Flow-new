import { Injectable } from '@nestjs/common';

export enum WorkflowStatus {
  PENDING = 'Pending',
  SENT = 'Sent',
  RECEIVED = 'Received',
  IN_DYEING = 'In Dyeing',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}

@Injectable()
export class WorkflowStatusService {

  deriveDyeingStatus(
    knitterDcNo?: string | null,
    companyDcNo?: string | null,
    finalWeight?: number | null,
  ): WorkflowStatus {

    if (finalWeight) {
      return WorkflowStatus.COMPLETED;
    }

    if (knitterDcNo && companyDcNo) {
      return WorkflowStatus.IN_DYEING;
    }

    if (knitterDcNo) {
      return WorkflowStatus.SENT;
    }

    return WorkflowStatus.PENDING;
  }

  deriveMemoStatus(
    knitterDcNo?: string | null,
    companyDcNo?: string | null,
  ): WorkflowStatus {

    if (knitterDcNo && companyDcNo) {
      return WorkflowStatus.IN_DYEING;
    }

    if (knitterDcNo) {
      return WorkflowStatus.SENT;
    }

    return WorkflowStatus.PENDING;
  }
}
