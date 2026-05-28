'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import api from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { DataTable } from '@/components/production/data-table';
import { planColumns } from '@/components/production/columns/plans-columns';
import { Row } from '@tanstack/react-table';
import { EmptyState } from '@/components/production/empty-state';
import { TableSkeleton } from '@/components/production/table-skeleton';
import { Pagination } from '@/components/production/pagination';
import { getProductionPlans } from '@/lib/api/production';
import { ProductionPlan, PaginatedResponse } from '@/types/production';
import {
  createProductionPlanSchema,
  type CreateProductionPlanInput,
} from '@/validators/create-production-plan';
import { PlusCircle, Trash2, Calendar, ClipboardList, RefreshCw, AlertCircle } from 'lucide-react';

interface KnittingLot {
  id: number;
  lotNo: string;
}

export default function ProductionPlanningPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [jobCardOpen, setJobCardOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const form = useForm<CreateProductionPlanInput>({
    resolver: zodResolver(createProductionPlanSchema),
    defaultValues: {
      lotNo: '',
      stage: '',
      plannedWeight: 0,
      priority: 'MEDIUM',
    },
  });

  // New Job Card form data
  const [jobCardForm, setJobCardForm] = useState({
    machineNo: '',
    operatorName: '',
    shift: 'SHIFT_A',
    targetWeight: '',
    remarks: '',
  });

  // Fetch plans via centralized query layer
  const { data: plansData, isLoading: plansLoading } = useQuery<PaginatedResponse<ProductionPlan>>({
    queryKey: ['plans', statusFilter, stageFilter, page],
    queryFn: () =>
      getProductionPlans({
        page,
        limit,
        status: statusFilter || undefined,
        stage: stageFilter || undefined,
      }),
    refetchInterval: 30000,
  });

  // Fetch knitting lots for dropdown
  const { data: knittingLots = [] } = useQuery<KnittingLot[]>({
    queryKey: ['knitting-lots'],
    queryFn: async () => {
      const response = await api.get('/knitting-lots');
      return response.data;
    },
  });

  // Mutations
  const createPlanMutation = useMutation<ProductionPlan, Error, CreateProductionPlanInput>({
    mutationFn: async (values) => {
      const response = await api.post('/production-planning', {
        ...values,
        plannedDate: new Date().toISOString().split('T')[0],
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['production-summary'] });
      queryClient.invalidateQueries({ queryKey: ['production-events'] });
      toast.success('Production plan created successfully');
      setCreateOpen(false);
      form.reset({
        lotNo: '',
        stage: '',
        plannedWeight: 0,
        priority: 'MEDIUM',
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || 'Failed to create production plan';
      toast.error(msg);
    },
  });

  const cancelPlanMutation = useMutation<unknown, Error, number>({
    mutationFn: async (id) => {
      const response = await api.delete(`/production-planning/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['production-summary'] });
      queryClient.invalidateQueries({ queryKey: ['production-events'] });
      toast.success('Production plan cancelled successfully');
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || 'Failed to cancel plan';
      toast.error(msg);
    },
  });

  const createJobCardMutation = useMutation<unknown, Error, Record<string, unknown>>({
    mutationFn: async (body) => {
      const response = await api.post('/production-planning/job-card', body);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-cards'] });
      queryClient.invalidateQueries({ queryKey: ['plans'] });
      queryClient.invalidateQueries({ queryKey: ['production-events'] });
      toast.success('Job card issued successfully');
      setJobCardOpen(false);
      setJobCardForm({
        machineNo: '',
        operatorName: '',
        shift: 'SHIFT_A',
        targetWeight: '',
        remarks: '',
      });
    },
    onError: (error: unknown) => {
      const err = error as { response?: { data?: { message?: string } } };
      const msg = err.response?.data?.message || 'Failed to issue job card';
      toast.error(msg);
    },
  });

  const handleCreatePlan = (values: CreateProductionPlanInput) => {
    createPlanMutation.mutate(values);
  };

  const handleCreateJobCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    createJobCardMutation.mutate({
      productionPlanId: selectedPlan.id,
      machineNo: jobCardForm.machineNo || undefined,
      operatorName: jobCardForm.operatorName || undefined,
      shift: jobCardForm.shift || undefined,
      targetWeight: parseFloat(jobCardForm.targetWeight),
      remarks: jobCardForm.remarks || undefined,
    });
  };

  const openJobCardModal = (plan: ProductionPlan) => {
    setSelectedPlan(plan);
    setJobCardForm({
      machineNo: '',
      operatorName: '',
      shift: 'SHIFT_A',
      targetWeight: String(plan.plannedWeight - plan.completedWeight),
      remarks: '',
    });
    setJobCardOpen(true);
  };

  const plansList = plansData?.data ?? [];

  // Append actions column to planColumns dynamically
  const columns = [
    ...planColumns,
    {
      id: 'delayed',
      header: 'Delayed',
      cell: ({ row }: { row: Row<ProductionPlan> }) => {
        const plan = row.original;
        return plan.delayed ? (
          <span className="flex items-center gap-1.5 text-rose-400 font-semibold text-xs bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded-full w-fit">
            <AlertCircle className="h-3 w-3" /> YES
          </span>
        ) : (
          <span className="text-slate-500 text-xs">NO</span>
        );
      },
    },
    {
      id: 'plannedDate',
      header: 'Planned Date',
      cell: ({ row }: { row: Row<ProductionPlan> }) => {
        const plan = row.original;
        return (
          <span className="text-slate-400 text-xs">
            {new Date(plan.plannedDate).toLocaleDateString()}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }: { row: Row<ProductionPlan> }) => {
        const plan = row.original;
        return (
          <div className="text-right space-x-2">
            {plan.status !== 'COMPLETED' && plan.status !== 'CANCELLED' && (
              <>
                <Button
                  size="sm"
                  onClick={() => openJobCardModal(plan)}
                  className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-600/30 text-xs"
                >
                  Issue Job Card
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm('Are you sure you want to cancel this plan?')) {
                      cancelPlanMutation.mutate(plan.id);
                    }
                  }}
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
              Production Planning
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Create plans, track stage-wise weight completion, and dispatch Job Cards to machines.
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-lg shadow-blue-500/20">
            <PlusCircle className="mr-2 h-4 w-4" /> Create Plan
          </Button>
        </div>

        {/* Filters Card */}
        <Card className="glass-card border-slate-800 bg-slate-900/40">
          <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
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
                className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Stage Search
              </label>
              <input
                type="text"
                placeholder="e.g. DYEING, KNITTING"
                value={stageFilter}
                onChange={(e) => {
                  setStageFilter(e.target.value.toUpperCase());
                  setPage(1);
                }}
                className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter('');
                  setStageFilter('');
                  setPage(1);
                }}
                className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Reset Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Production Plans Table */}
        <Card className="glass-card border-slate-800 bg-slate-900/40">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-blue-400" />
              Active Production Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            {plansLoading ? (
              <TableSkeleton />
            ) : plansList.length === 0 ? (
              <EmptyState
                title="No Plans Found"
                description="No production plans match the filter criteria."
              />
            ) : (
              <div className="space-y-4">
                <DataTable columns={columns} data={plansList} />

                {/* Pagination Controls */}
                {plansData && plansData.totalPages > 1 && (
                  <Pagination
                    page={page}
                    totalPages={plansData.totalPages}
                    onPageChange={setPage}
                  />
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Plan Dialog */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Create Production Plan
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreatePlan)} className="space-y-4 pt-2">
                <FormField
                  control={form.control}
                  name="lotNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lot No</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select a lot...</option>
                          {knittingLots.map((lot) => (
                            <option key={lot.id} value={lot.lotNo}>
                              {lot.lotNo}
                            </option>
                          ))}
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stage</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Select a stage...</option>
                          <option value="KNITTING">Knitting</option>
                          <option value="DYEING">Dyeing</option>
                          <option value="COMPACTING">Compacting</option>
                          <option value="FINISHING">Finishing</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="LOW">Low</option>
                          <option value="MEDIUM">Medium</option>
                          <option value="HIGH">High</option>
                          <option value="URGENT">Urgent</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plannedWeight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planned Weight</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          className="border-slate-700/60 bg-slate-800/80 text-slate-200 focus-visible:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-4 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} className="border-slate-750 text-slate-300 hover:bg-slate-800">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPlanMutation.isPending} className="bg-blue-600 hover:bg-blue-500">
                    {createPlanMutation.isPending ? 'Creating...' : 'Create Plan'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Create Job Card Dialog */}
        <Dialog open={jobCardOpen} onOpenChange={setJobCardOpen}>
          <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-indigo-500" />
                Issue Job Card
              </DialogTitle>
            </DialogHeader>
            {selectedPlan && (
              <p className="text-xs text-slate-400 px-1">
                Issuing job card for Plan <strong className="text-slate-300">#{selectedPlan.planNo}</strong> (Lot: {selectedPlan.lotNo}, Stage: {selectedPlan.stage}).
              </p>
            )}
            <form onSubmit={handleCreateJobCard} className="space-y-4 pt-2">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Machine No</label>
                <input
                  type="text"
                  value={jobCardForm.machineNo}
                  onChange={(e) => setJobCardForm({ ...jobCardForm, machineNo: e.target.value })}
                  className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. MC-01"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Operator Name</label>
                <input
                  type="text"
                  value={jobCardForm.operatorName}
                  onChange={(e) => setJobCardForm({ ...jobCardForm, operatorName: e.target.value })}
                  className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. John Doe"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Shift</label>
                  <select
                    value={jobCardForm.shift}
                    onChange={(e) => setJobCardForm({ ...jobCardForm, shift: e.target.value })}
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
                    type="number"
                    step="0.01"
                    required
                    value={jobCardForm.targetWeight}
                    onChange={(e) => setJobCardForm({ ...jobCardForm, targetWeight: e.target.value })}
                    className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g. 150"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Remarks</label>
                <textarea
                  value={jobCardForm.remarks}
                  onChange={(e) => setJobCardForm({ ...jobCardForm, remarks: e.target.value })}
                  rows={2}
                  className="w-full rounded-lg border border-slate-700/60 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Execution instructions..."
                />
              </div>

              <div className="flex gap-4 justify-end pt-2">
                <Button type="button" variant="outline" onClick={() => setJobCardOpen(false)} className="border-slate-750 text-slate-300 hover:bg-slate-800">
                  Cancel
                </Button>
                <Button type="submit" disabled={createJobCardMutation.isPending} className="bg-indigo-600 hover:bg-indigo-500">
                  {createJobCardMutation.isPending ? 'Issuing...' : 'Issue Job Card'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
