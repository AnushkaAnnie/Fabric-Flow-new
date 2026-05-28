'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { completeJobCard, startJobCard } from '@/lib/api/production';
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

  // Sync state when drawer opens or job changes
  useEffect(() => {
    if (job) {
      const timer = setTimeout(() => {
        setCompletedWeight(String(job.targetWeight));
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [job]);

  const startMutation = useMutation({
    mutationFn: () => {
      if (!job) throw new Error('No job selected');
      return startJobCard(job.id);
    },
    onSuccess: () => {
      toast.success('Job execution started');
      queryClient.invalidateQueries({ queryKey: ['job-cards'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['production-events'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to start job card');
    },
  });

  const completeMutation = useMutation({
    mutationFn: (weight: number) => {
      if (!job) throw new Error('No job selected');
      return completeJobCard(job.id, weight);
    },
    onSuccess: () => {
      toast.success('Job completed successfully');
      queryClient.invalidateQueries({ queryKey: ['job-cards'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['production-summary'] });
      queryClient.invalidateQueries({ queryKey: ['production-events'] });
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : 'Failed to complete job card');
    },
  });

  if (!job) {
    return null;
  }

  const handleCompleteClick = () => {
    const weight = parseFloat(completedWeight);
    if (isNaN(weight) || weight <= 0) {
      toast.error('Please enter a valid weight');
      return;
    }
    if (weight > job.targetWeight) {
      toast.error(`Completed weight cannot exceed target weight of ${job.targetWeight} kg`);
      return;
    }
    completeMutation.mutate(weight);
  };

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
    >
      <SheetContent className="w-[500px] overflow-y-auto bg-slate-950 border-slate-800 text-slate-100">
        <SheetHeader className="border-b border-slate-850 pb-4">
          <SheetTitle className="text-xl font-bold text-slate-100">
            Job Execution
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-2 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800/60">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Job Card</p>
              <p className="font-mono text-sm font-semibold text-indigo-300 mt-1">{job.jobCardNo}</p>
            </div>
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Status</p>
              <div className="mt-1">
                <StatusBadge status={job.status} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {job.productionPlan && (
              <>
                <div>
                  <p className="text-slate-400 text-sm">Plan Ref</p>
                  <p className="font-medium text-slate-200">#{job.productionPlan.planNo}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Lot & Stage</p>
                  <p className="font-medium text-slate-200">
                    {job.productionPlan.lotNo} ({job.productionPlan.stage})
                  </p>
                </div>
              </>
            )}

            <div>
              <p className="text-slate-400 text-sm font-medium">Allocated Machine</p>
              <p className="font-medium text-slate-200">{job.machineNo || 'Unassigned'}</p>
            </div>

            <div>
              <p className="text-slate-400 text-sm font-medium">Assigned Operator</p>
              <p className="font-medium text-slate-200">{job.operatorName || 'Unassigned'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-slate-400 text-sm font-medium">Shift</p>
                <p className="font-medium text-slate-200">{job.shift || 'N/A'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm font-medium">Target Weight</p>
                <p className="font-medium text-slate-200">{job.targetWeight} kg</p>
              </div>
            </div>

            {job.remarks && (
              <div>
                <p className="text-slate-400 text-sm font-medium">Remarks / Instructions</p>
                <p className="text-slate-300 text-sm bg-slate-900/50 p-2.5 rounded-lg border border-slate-800/40 mt-1 whitespace-pre-wrap">
                  {job.remarks}
                </p>
              </div>
            )}
          </div>

          {/* Action Area */}
          <div className="border-t border-slate-850 pt-6 space-y-4">
            {job.status === 'ISSUED' && (
              <Button
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
                className="w-full bg-amber-600 hover:bg-amber-500 shadow-lg shadow-amber-500/10"
              >
                <Play className="mr-2 h-4 w-4" />
                {startMutation.isPending ? 'Starting...' : 'Start Job Work'}
              </Button>
            )}

            {job.status === 'IN_PROGRESS' && (
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
                    onChange={(e) => setCompletedWeight(e.target.value)}
                    className="border-slate-700 bg-slate-900 text-slate-200 focus-visible:ring-emerald-500"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Completed weight must not exceed the target weight of {job.targetWeight} kg.
                  </p>
                </div>

                <Button
                  onClick={handleCompleteClick}
                  disabled={completeMutation.isPending}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-500/10"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {completeMutation.isPending ? 'Completing...' : 'Complete Job Work'}
                </Button>
              </div>
            )}

            {job.status === 'COMPLETED' && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3.5 text-center text-xs text-emerald-400 font-semibold">
                This job has been completed. Completed Weight: {job.completedWeight} kg.
              </div>
            )}

            {job.status === 'CANCELLED' && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3.5 text-center text-xs text-red-400 font-semibold">
                This job card was cancelled.
              </div>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
