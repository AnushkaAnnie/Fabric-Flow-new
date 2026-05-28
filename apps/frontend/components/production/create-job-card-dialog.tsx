'use client';

import { FormEvent } from 'react';
import { ClipboardList } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateJobCard } from '@/hooks/use-create-job-card';
import { ProductionPlan } from '@/types/production';

interface CreateJobCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  plan: ProductionPlan | null;
}

export function CreateJobCardDialog({
  open,
  onOpenChange,
  plan,
}: CreateJobCardDialogProps) {
  const createJobCardMutation = useCreateJobCard(() => {
    onOpenChange(false);
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!plan) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const machineNo = String(formData.get('machineNo') ?? '');
    const operatorName = String(formData.get('operatorName') ?? '');
    const shift = String(formData.get('shift') ?? '');
    const targetWeight = Number(formData.get('targetWeight'));
    const remarks = String(formData.get('remarks') ?? '');

    createJobCardMutation.mutate({
      productionPlanId: plan.id,
      machineNo: machineNo || undefined,
      operatorName: operatorName || undefined,
      shift: shift || undefined,
      targetWeight: Number(targetWeight),
      remarks: remarks || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-indigo-500" />
            Issue Job Card
          </DialogTitle>
        </DialogHeader>

        {plan && (
          <p className="text-xs text-slate-400 px-1">
            Issuing job card for Plan{' '}
            <strong className="text-slate-300">#{plan.planNo}</strong> (Lot:{' '}
            {plan.lotNo}, Stage: {plan.stage}).
          </p>
        )}

        <form key={plan?.id ?? 'empty'} onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Machine No</label>
            <input
              name="machineNo"
              type="text"
              className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. MC-01"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Operator Name</label>
            <input
              name="operatorName"
              type="text"
              className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Shift</label>
              <select
                name="shift"
                defaultValue="SHIFT_A"
                className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="SHIFT_A">Shift A</option>
                <option value="SHIFT_B">Shift B</option>
                <option value="SHIFT_C">Shift C</option>
                <option value="SHIFT_NIGHT">Night Shift</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Target Weight (kg) *</label>
              <input
                name="targetWeight"
                type="number"
                step="0.01"
                required
                min="0.01"
                defaultValue={plan ? Math.max(plan.plannedWeight - plan.completedWeight, 0) : ''}
                className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g. 150"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Remarks</label>
            <textarea
              name="remarks"
              rows={2}
              className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Execution instructions..."
            />
          </div>

          <div className="flex gap-4 justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-750 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createJobCardMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              {createJobCardMutation.isPending ? 'Issuing...' : 'Issue Job Card'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
