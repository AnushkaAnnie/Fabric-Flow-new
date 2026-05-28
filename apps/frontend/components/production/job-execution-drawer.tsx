'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { completeJobCard, startJobCard, getJobCards } from '@/lib/api/production';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { StatusBadge } from './status-badge';
import { Play, CheckCircle } from 'lucide-react';
import { JobCard } from '@/types/production';
import { QUERY_KEYS } from '@/lib/query-keys';
import { QUERY_CONFIG } from '@/lib/react-query-config';

interface JobExecutionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobCard | null;
}

export function JobExecutionDrawer({
  open,
  onOpenChange,
  job,
}: JobExecutionDrawerProps) {
  const queryClient = useQueryClient();
  const [completedWeight, setCompletedWeight] = useState('');

  // Fetch the latest job cards list to ensure drawer state is in sync with background polls
  const { data: jobCardsData } = useQuery({
    queryKey: QUERY_KEYS.jobCards,
    queryFn: () => getJobCards({ limit: 100 }),
    enabled: open && !!job,
    ...QUERY_CONFIG.execution,
  });

  const jobs = jobCardsData?.data;
  const latestJob = jobs?.find((j) => j.id === job?.id) ?? job;

  // Sync state when drawer opens or latestJob changes
  useEffect(() => {
    if (latestJob) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCompletedWeight(String(latestJob.targetWeight));
    }
  }, [latestJob]);

  const startMutation = useMutation({
    mutationFn: () => {
      if (!latestJob) throw new Error('No job selected');
      return startJobCard(latestJob.id);
    },
    onSuccess: () => {
      toast.success('Job started');
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobCards });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to start job card');
    },
  });

  const completeMutation = useMutation({
    mutationFn: (weight: number) => {
      if (!latestJob) throw new Error('No job selected');
      return completeJobCard(latestJob.id, weight);
    },
    onSuccess: () => {
      toast.success('Job completed');
      onOpenChange(false);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.jobCards });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.dashboard });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.events });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.plans });
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to complete job card');
    },
  });

  if (!latestJob) {
    return null;
  }

  const handleCompleteClick = () => {
    const weight = parseFloat(completedWeight);
    if (isNaN(weight) || weight <= 0) {
      toast.error('Please enter a valid weight');
      return;
    }
    if (weight > latestJob.targetWeight) {
      toast.error(`Completed weight cannot exceed target weight of ${latestJob.targetWeight} kg`);
      return;
    }
    completeMutation.mutate(weight);
  };

  const isProcessing = startMutation.isPending || completeMutation.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] overflow-y-auto bg-slate-950 border-slate-800 text-slate-100">
        {isProcessing && (
          <div className="mb-4 rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-300">
            Processing job execution...
          </div>
        )}

        <SheetHeader className="border-b border-slate-850 pb-4">
          <SheetTitle className="text-xl font-bold text-slate-100">
            Job Execution
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/60">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Job Card</p>
              <p className="font-mono text-sm font-semibold text-indigo-300 mt-1">{latestJob.jobCardNo}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Status</p>
              <div className="mt-1">
                <StatusBadge status={latestJob.status} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {latestJob.productionPlan && (
              <>
                <div>
                  <p className="text-slate-400 text-sm">Plan Ref</p>
                  <p className="font-medium text-slate-200">#{latestJob.productionPlan.planNo}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Lot & Stage</p>
                  <p className="font-medium text-slate-200">
                    {latestJob.productionPlan.lotNo} ({latestJob.productionPlan.stage})
                  </p>
                </div>
              </>
            )}

            <div>
              <p className="text-slate-400 text-sm font-medium">Allocated Machine</p>
              <p className="font-medium text-slate-200">{latestJob.machineNo || 'Unassigned'}</p>
            </div>

            <div>
              <p className="text-slate-400 text-sm font-medium">Assigned Operator</p>
              <p className="font-medium text-slate-200">{latestJob.operatorName || 'Unassigned'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm font-medium">Shift</p>
                <p className="font-medium text-slate-200">{latestJob.shift || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium">Target Weight</p>
                <p className="font-medium text-slate-200">{latestJob.targetWeight} kg</p>
              </div>
            </div>

            {latestJob.remarks && (
              <div>
                <p className="text-slate-400 text-sm font-medium">Remarks / Instructions</p>
                <p className="text-slate-300 text-sm bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/40 mt-1 whitespace-pre-wrap">
                  {latestJob.remarks}
                </p>
              </div>
            )}
          </div>

          {/* Action Area */}
          <div className="border-t border-slate-850 pt-6">
            <div className="flex flex-col gap-4">
              {latestJob.status === 'ISSUED' && (
                <Button
                  disabled={isProcessing}
                  onClick={() => startMutation.mutate()}
                  className="w-full bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-500/10"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {startMutation.isPending ? 'Starting...' : 'Start'}
                </Button>
              )}

              {latestJob.status === 'IN_PROGRESS' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1.5 font-medium">
                      Actual Completed Weight (kg) *
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      value={completedWeight}
                      disabled={isProcessing}
                      onChange={(e) => setCompletedWeight(e.target.value)}
                      className="border-slate-700 bg-slate-900 text-slate-200 focus-visible:ring-emerald-500"
                    />
                  </div>

                  <Button
                    variant="secondary"
                    disabled={isProcessing}
                    onClick={handleCompleteClick}
                    className="w-full bg-emerald-650 hover:bg-emerald-600 shadow-lg text-slate-100"
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Complete
                  </Button>
                </div>
              )}

              {latestJob.status === 'COMPLETED' && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-center text-xs text-emerald-400 font-semibold">
                  This job has been completed. Completed Weight: {latestJob.completedWeight} kg.
                </div>
              )}

              {latestJob.status === 'CANCELLED' && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-center text-xs text-red-400 font-semibold">
                  This job card was cancelled.
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
