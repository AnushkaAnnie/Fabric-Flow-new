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

  machineNo: string;

  operatorName: string;

  shift: string;

  status: string;

  targetWeight: number;
}

export interface ProductionEvent {
  id: number;

  eventType: string;

  message: string;

  createdAt: string;
}
