import { useQuery } from '@tanstack/react-query';
import { getJobCards } from '@/lib/api/production';
import { QUERY_KEYS } from '@/lib/query-keys';
import { QUERY_CONFIG } from '@/lib/react-query-config';

interface Params {
  page: number;
  limit: number;
  status?: string;
}

export function useJobCards({
  page,
  limit,
  status,
}: Params) {
  return useQuery({
    queryKey: [
      ...QUERY_KEYS.jobCards,
      status || '',
      page,
      limit,
    ],

    queryFn: () =>
      getJobCards({
        page,
        limit,
        status: status || undefined,
      }),

    ...QUERY_CONFIG.execution,
  });
}
