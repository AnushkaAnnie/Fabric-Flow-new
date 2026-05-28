import { useMutation, useQueryClient } from '@tanstack/react-query';
import { completeJobCard } from '@/lib/api/production';
import { QUERY_KEYS } from '@/lib/query-keys';
import { toast } from 'sonner';

interface CompleteJobParams {
  id: number;
  completedWeight: number;
}

export function useCompleteJob(onSuccess?: () => void) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, completedWeight }: CompleteJobParams) =>
      completeJobCard(id, completedWeight),

    onSuccess: () => {
      toast.success('Job completed');
      onSuccess?.();
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobCards });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.plans });
    },

    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to complete job');
    },
  });
}
