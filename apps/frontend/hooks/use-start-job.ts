import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { startJobCard } from '@/lib/api/production';
import { QUERY_KEYS } from '@/lib/query-keys';

export function useStartJob(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => startJobCard(id),

    onSuccess: () => {
      toast.success('Job started');

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobCards });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.plans });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });

      onSuccess?.();
    },

    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to start job',
      );
    },
  });
}
