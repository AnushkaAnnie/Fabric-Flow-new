export interface ProductionPlan {
  id: number;
  planNo: string;
  lotNo: string;
  stage: string;
  status: string;
  delayed: boolean;
  plannedWeight: number;
  completedWeight: number;
  plannedDate: string;
}

export interface JobCard {
  id: number;
  jobCardNo: string;
  machineNo: string | null;
  operatorName: string | null;
  shift: string | null;
  status: string;
  targetWeight: number;
  completedWeight: number;
  issuedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  remarks: string | null;
}

export type ProductionEventType =
  | 'PLAN_CREATED'
  | 'PLAN_UPDATED'
  | 'PLAN_CANCELLED'
  | 'JOB_CARD_CREATED'
  | 'JOB_CARD_STARTED'
  | 'JOB_CARD_COMPLETED';

export interface ProductionEvent {
  id: number;
  productionPlanId: number | null;
  jobCardId: number | null;
  eventType: ProductionEventType;
  message: string;
  metadata: unknown | null;
  createdAt: string;
}

export interface ProductionSummary {
  totalPlans: number;
  completedPlans: number;
  delayedPlans: number;
  inProgressPlans: number;
  plannedWeight: number;
  completedWeight: number;
  efficiency: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
}

export interface CreateJobCardPayload {
  productionPlanId: number;
  machineNo?: string;
  operatorName?: string;
  shift?: string;
  targetWeight: number;
  remarks?: string;
}

export interface CancelPlanPayload {
  id: number;
}

export interface CreateProductionPlanPayload {
  lotNo: string;
  stage: string;
  plannedWeight: number;
  plannedDate: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  remarks?: string;
}

export interface CompleteJobPayload {
  id: number;
  completedWeight: number;
}
