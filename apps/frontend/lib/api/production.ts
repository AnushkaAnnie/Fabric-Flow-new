import { apiClient } from './client';
import {
  JobCard,
  PaginatedResponse,
  ProductionEvent,
  ProductionPlan,
} from '@/types/production';

export async function getProductionPlans(
  params?: Record<string, unknown>,
): Promise<PaginatedResponse<ProductionPlan>> {
  return apiClient<PaginatedResponse<ProductionPlan>>(
    '/production-planning',
    {
      params,
    },
  );
}

export async function getJobCards(
  params?: Record<string, unknown>,
): Promise<PaginatedResponse<JobCard>> {
  return apiClient<PaginatedResponse<JobCard>>(
    '/production-planning/job-cards',
    {
      params,
    },
  );
}

export async function getProductionEvents(): Promise<ProductionEvent[]> {
  return apiClient<ProductionEvent[]>(
    '/production-planning/events',
  );
}

export async function getProductionSummary(): Promise<unknown> {
  return apiClient(
    '/production-planning/summary',
  );
}

export async function getTodayPlans(): Promise<ProductionPlan[]> {
  return apiClient<ProductionPlan[]>(
    '/production-planning/today',
  );
}

export async function getDelayedPlans(): Promise<ProductionPlan[]> {
  return apiClient<ProductionPlan[]>(
    '/production-planning/delayed',
  );
}

export async function startJobCard(id: number) {
  return apiClient(
    `/production-planning/job-card/${id}/start`,
    {
      method: 'PATCH',
    },
  );
}

export async function completeJobCard(id: number, completedWeight: number) {
  return apiClient(
    `/production-planning/job-card/${id}/complete`,
    {
      method: 'PATCH',
      body: JSON.stringify({ completedWeight }),
    },
  );
}
