// Canonical operational workflow statuses — kept in sync with
// packages/shared/src/contracts/workflow.contracts.ts WorkflowStatus enum
export enum WorkflowStatus {
  PENDING = 'Pending',
  SENT = 'Sent',
  RECEIVED = 'Received',
  IN_DYEING = 'In Dyeing',
  COMPLETED = 'Completed',
  CANCELLED = 'Cancelled',
}
