import { apiClient } from './client';
import {
  CancelPlanPayload,
  CompleteJobPayload,
  CreateJobCardPayload,
  CreateProductionPlanPayload,
  JobCard,
  PaginatedResponse,
  ProductionEvent,
  ProductionPlan,
  ProductionSummary,
} from '@/types/production';

export async function getProductionPlans(params: {
  page?: number;
  limit?: number;
  status?: string;
  stage?: string;
}) {
  return apiClient<PaginatedResponse<ProductionPlan>>('/production-planning', {
    params,
  });
}

export async function getJobCards(params: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return apiClient<PaginatedResponse<JobCard>>('/production-planning/job-cards', {
    params,
  });
}

export async function getProductionSummary() {
  return apiClient<ProductionSummary>('/production-planning/summary');
}

export async function getProductionEvents() {
  return apiClient<ProductionEvent[]>('/production-planning/events');
}

export async function getTodayPlans() {
  return apiClient<ProductionPlan[]>('/production-planning/today');
}

export async function getDelayedPlans() {
  return apiClient<ProductionPlan[]>('/production-planning/delayed');
}

export async function createProductionPlan(payload: CreateProductionPlanPayload) {
  return apiClient<ProductionPlan>('/production-planning', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createJobCard(payload: CreateJobCardPayload) {
  return apiClient<JobCard>('/production-planning/job-card', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function startJobCard(id: number) {
  return apiClient<JobCard>(`/production-planning/job-card/${id}/start`, {
    method: 'PATCH',
  });
}

export async function completeJobCard({ id, completedWeight }: CompleteJobPayload) {
  return apiClient<JobCard>(`/production-planning/job-card/${id}/complete`, {
    method: 'PATCH',
    body: JSON.stringify({ completedWeight }),
  });
}

export async function cancelPlan({ id }: CancelPlanPayload) {
  return apiClient<ProductionPlan>(`/production-planning/${id}`, {
    method: 'DELETE',
  });
}
