import { useQuery } from '@tanstack/react-query';
import { getProductionPlans } from '@/lib/api/production';
import { QUERY_KEYS } from '@/lib/query-keys';
import { QUERY_CONFIG } from '@/lib/react-query-config';

interface Params {
  page: number;
  limit: number;
  status?: string;
  stage?: string;
}

export function useProductionPlans({
  page,
  limit,
  status,
  stage,
}: Params) {
  return useQuery({
    queryKey: [
      ...QUERY_KEYS.plans,
      status || '',
      stage || '',
      page,
      limit,
    ],

    queryFn: () =>
      getProductionPlans({
        page,
        limit,
        status: status || undefined,
        stage: stage || undefined,
      }),

    ...QUERY_CONFIG.tables,
  });
}
