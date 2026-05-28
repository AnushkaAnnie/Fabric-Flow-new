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
  remarks?: string;
}

export interface JobCard {
  id: number;
  jobCardNo: string;
  productionPlanId: number;
  machineNo?: string;
  operatorName?: string;
  shift?: string;
  status: string;
  targetWeight: number;
  completedWeight: number;
  remarks?: string;
  issuedAt?: string;
  startedAt?: string;
  completedAt?: string;
  productionPlan?: {
    planNo: string;
    lotNo: string;
    stage: string;
  };
}

export type ProductionEventType =
  | 'PLAN_CREATED'
  | 'PLAN_UPDATED'
  | 'JOB_CARD_CREATED'
  | 'JOB_STARTED'
  | 'JOB_COMPLETED'
  | 'PLAN_CANCELLED';

export interface ProductionEvent {
  id: number;
  productionPlanId?: number;
  jobCardId?: number;
  eventType: ProductionEventType;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  totalPages: number;
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

