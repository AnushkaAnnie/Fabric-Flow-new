import { useMutation, useQueryClient } from '@tanstack/react-query';
import { startJobCard } from '@/lib/api/production';
import { QUERY_KEYS } from '@/lib/query-keys';
import { toast } from 'sonner';

export function useStartJob(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => startJobCard(id),

    onSuccess: () => {
      toast.success('Job started');
      onSuccess?.();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobCards });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });
    },

    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to start job');
    },
  });
}
