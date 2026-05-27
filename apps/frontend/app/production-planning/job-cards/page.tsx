'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Play, CheckCircle2, ShieldAlert, Cpu, UserCheck } from 'lucide-react';

interface JobCard {
  id: number;
  jobCardNo: string;
  productionPlanId: number;
  machineNo?: string;
  operatorName?: string;
  shift?: string;
  targetWeight: number;
  completedWeight: number;
  status: string;
  remarks?: string;
  issuedAt?: string;
  startedAt?: string;
  completedAt?: string;
  productionPlan: {
    planNo: string;
    lotNo: string;
    stage: string;
  };
}

export default function JobCardsPage() {
  const queryClient = useQueryClient();
  const [completeOpen, setCompleteOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<JobCard | null>(null);
  const [completedWeight, setCompletedWeight] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  // Fetch job cards
  const { data: jobCardsData, isLoading: loading } = useQuery<{
    data: JobCard[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }>({
    queryKey: ['job-cards', statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      if (statusFilter) params.append('status', statusFilter);

      const response = await api.get(`/production-planning/job-cards?${params.toString()}`);
      return response.data;
    },
  });

  // Start Job Card Mutation
  const startMutation = useMutation<unknown, Error, number>({
    mutationFn: async (id) => {
      const response = await api.patch(`/production-planning/job-card/${id}/start`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-cards'] });
      queryClient.invalidateQueries({ queryKey: ['production-plans'] });
      queryClient.invalidateQueries({ queryKey: ['production-events'] });
      toast.success('Job card execution started');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || 'Failed to start job card';
      toast.error(msg);
    },
  });

  // Complete Job Card Mutation
  const completeMutation = useMutation<unknown, Error, { id: number; weight: number }>({
    mutationFn: async ({ id, weight }) => {
      const response = await api.patch(`/production-planning/job-card/${id}/complete`, {
        completedWeight: weight,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-cards'] });
      queryClient.invalidateQueries({ queryKey: ['production-plans'] });
      queryClient.invalidateQueries({ queryKey: ['production-summary'] });
      queryClient.invalidateQueries({ queryKey: ['production-events'] });
      toast.success('Job card completed successfully');
      setCompleteOpen(false);
      setSelectedCard(null);
      setCompletedWeight('');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || 'Failed to complete job card';
      toast.error(msg);
    },
  });

  const handleStart = (id: number) => {
    startMutation.mutate(id);
  };

  const openCompleteModal = (card: JobCard) => {
    setSelectedCard(card);
    setCompletedWeight(String(card.targetWeight));
    setCompleteOpen(true);
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard) return;
    const weight = parseFloat(completedWeight);
    if (isNaN(weight) || weight <= 0) {
      toast.error('Please enter a valid weight');
      return;
    }
    if (weight > selectedCard.targetWeight) {
      toast.error(`Completed weight cannot exceed target weight of ${selectedCard.targetWeight} kg`);
      return;
    }
    completeMutation.mutate({ id: selectedCard.id, weight });
  };

  const cardsList = jobCardsData?.data ?? [];
  const pagination = jobCardsData?.pagination;

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">
          Job Card Management
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Execute work orders, log machine allocation, record operator activity, and track completed weights.
        </p>
      </div>

      {/* Filter Card */}
      <Card className="glass-card border-slate-800 bg-slate-900/40">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Status Filter
            </label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Job Cards</option>
              <option value="ISSUED">Issued</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setStatusFilter('');
                setPage(1);
              }}
              className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Reset Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Job Cards Table */}
      <Card className="glass-card border-slate-800 bg-slate-900/40">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-200 flex items-center gap-2">
            <Cpu className="h-5 w-5 text-indigo-400" />
            Active Job Cards
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-12 flex justify-center items-center text-slate-400">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" /> Loading job cards...
            </div>
          ) : cardsList.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              No job cards found matching the criteria.
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Job Card</TableHead>
                    <TableHead className="text-slate-400">Plan</TableHead>
                    <TableHead className="text-slate-400">Lot & Stage</TableHead>
                    <TableHead className="text-slate-400">Machine</TableHead>
                    <TableHead className="text-slate-400">Operator</TableHead>
                    <TableHead className="text-slate-400">Shift</TableHead>
                    <TableHead className="text-slate-400">Target</TableHead>
                    <TableHead className="text-slate-400">Completed</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cardsList.map((card) => (
                    <TableRow key={card.id} className="border-slate-800/60 hover:bg-slate-800/30">
                      <TableCell className="font-semibold text-indigo-300 font-mono text-xs">
                        {card.jobCardNo}
                      </TableCell>
                      <TableCell className="text-slate-300 font-semibold">
                        #{card.productionPlan?.planNo || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-slate-400 text-xs font-mono">{card.productionPlan?.lotNo}</span>
                          <span className="text-[10px] uppercase font-bold text-slate-500">
                            {card.productionPlan?.stage}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300 font-medium">
                        {card.machineNo ? (
                          <span className="flex items-center gap-1">
                            <Cpu className="h-3.5 w-3.5 text-slate-500" /> {card.machineNo}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic text-xs">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {card.operatorName ? (
                          <span className="flex items-center gap-1">
                            <UserCheck className="h-3.5 w-3.5 text-slate-500" /> {card.operatorName}
                          </span>
                        ) : (
                          <span className="text-slate-600 italic text-xs">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-400 text-xs">{card.shift || '-'}</TableCell>
                      <TableCell className="text-slate-300 font-medium">{card.targetWeight} kg</TableCell>
                      <TableCell className="text-slate-300 font-medium">{card.completedWeight} kg</TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          card.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          card.status === 'IN_PROGRESS' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          card.status === 'CANCELLED' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        }`}>
                          {card.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {card.status === 'ISSUED' && (
                          <Button
                            size="sm"
                            onClick={() => handleStart(card.id)}
                            disabled={startMutation.isPending}
                            className="bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-500/10 text-xs"
                          >
                            <Play className="mr-1.5 h-3.5 w-3.5" /> Start Work
                          </Button>
                        )}
                        {card.status === 'IN_PROGRESS' && (
                          <Button
                            size="sm"
                            onClick={() => openCompleteModal(card)}
                            className="bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-500/10 text-xs"
                          >
                            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Complete Work
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                  <span className="text-xs text-slate-500">
                    Showing Page {pagination.page} of {pagination.totalPages} ({pagination.total} cards total)
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page === 1}
                      onClick={() => setPage(p => p - 1)}
                      className="border-slate-800 text-slate-400 hover:bg-slate-800"
                    >
                      Previous
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={page === pagination.totalPages}
                      onClick={() => setPage(p => p + 1)}
                      className="border-slate-800 text-slate-400 hover:bg-slate-800"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Job Card Modal */}
      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Complete Job Card
            </DialogTitle>
          </DialogHeader>
          {selectedCard && (
            <div className="bg-slate-800/40 border border-slate-700/30 rounded-xl p-3 mb-2 space-y-1">
              <div className="text-xs text-slate-400 flex justify-between">
                <span>Job Card:</span>
                <strong className="text-slate-300 font-mono">#{selectedCard.jobCardNo}</strong>
              </div>
              <div className="text-xs text-slate-400 flex justify-between">
                <span>Stage:</span>
                <span className="text-slate-300 font-semibold">{selectedCard.productionPlan?.stage}</span>
              </div>
              <div className="text-xs text-slate-400 flex justify-between">
                <span>Target Weight:</span>
                <span className="text-slate-300 font-semibold">{selectedCard.targetWeight} kg</span>
              </div>
            </div>
          )}
          <form onSubmit={handleCompleteSubmit} className="space-y-4 pt-1">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Completed Weight (kg) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={completedWeight}
                onChange={(e) => setCompletedWeight(e.target.value)}
                className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Actual weight completed"
              />
              <p className="text-[10px] text-slate-500 mt-1 flex items-start gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                Note: Entering a weight will consume corresponding quantities from the inventory ledger. Weight must be &le; {selectedCard?.targetWeight} kg.
              </p>
            </div>

            <div className="flex gap-4 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setCompleteOpen(false)} className="border-slate-750 text-slate-300 hover:bg-slate-800">
                Cancel
              </Button>
              <Button type="submit" disabled={completeMutation.isPending} className="bg-emerald-600 hover:bg-emerald-500">
                {completeMutation.isPending ? 'Saving...' : 'Complete Work'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
