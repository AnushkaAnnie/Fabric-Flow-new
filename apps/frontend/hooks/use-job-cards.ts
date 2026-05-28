import { useQuery } from '@tanstack/react-query';
import { getJobCards } from '@/lib/api/production';
import { QUERY_KEYS } from '@/lib/query-keys';
import { QUERY_CONFIG } from '@/lib/react-query-config';

export function useJobCards(params: {
  page: number;
  limit: number;
  status?: string;
}) {
  return useQuery({
    queryKey: [
      ...QUERY_KEYS.jobCards,
      params.page,
      params.limit,
      params.status ?? '',
    ],
    queryFn: () => getJobCards(params),
    ...QUERY_CONFIG.execution,
  });
}
