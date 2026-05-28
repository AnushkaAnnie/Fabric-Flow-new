import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { createJobCard } from '@/lib/api/production';
import { QUERY_KEYS } from '@/lib/query-keys';
import { CreateJobCardPayload } from '@/types/production';

export function useCreateJobCard(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateJobCardPayload) =>
      createJobCard(payload),

    onSuccess: () => {
      toast.success('Job card created');

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.jobCards,
      });

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.plans,
      });

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.dashboard,
      });

      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.events,
      });

      onSuccess?.();
    },

    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create job card',
      );
    },
  });
}
