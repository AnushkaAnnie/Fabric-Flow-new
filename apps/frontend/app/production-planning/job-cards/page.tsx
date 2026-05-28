'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataTable } from '@/components/production/data-table';
import { QueryStateWrapper } from '@/components/production/query-state-wrapper';
import { jobCardColumns } from '@/components/production/columns/job-cards-columns';
import { Row } from '@tanstack/react-table';
import { JobExecutionDrawer } from '@/components/production/job-execution-drawer';
import { EmptyState } from '@/components/production/empty-state';
import { Pagination } from '@/components/production/pagination';
import { useJobCards } from '@/hooks/use-job-cards';
import { JobCard } from '@/types/production';
import { RefreshCw } from 'lucide-react';

export default function JobCardsPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data: jobCardsData, isLoading, error, refetch } = useJobCards({
    page,
    limit,
    status: statusFilter || undefined,
  });

  const cardsList = jobCardsData?.data ?? [];

  // Define columns dynamically to append target/completed fields and the manage button
  const columns = [
    ...jobCardColumns,
    {
      id: 'targetWeight',
      header: 'Target Weight',
      cell: ({ row }: { row: Row<JobCard> }) => `${row.original.targetWeight} kg`,
    },
    {
      id: 'completedWeight',
      header: 'Completed Weight',
      cell: ({ row }: { row: Row<JobCard> }) => `${row.original.completedWeight} kg`,
    },
    {
      id: 'actions',
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }: { row: Row<JobCard> }) => {
        const card = row.original;
        return (
          <div className="text-right">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedJob(card);
                setDrawerOpen(true);
              }}
              className="border-slate-800 text-indigo-300 hover:bg-slate-800 text-xs"
            >
              Manage Execution
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <ProtectedRoute>
      <QueryStateWrapper isLoading={isLoading} error={error} retry={refetch}>
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
                <RefreshCw className="h-5 w-5 text-indigo-400 animate-spin-slow" />
                Active Job Cards
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cardsList.length === 0 ? (
                <EmptyState
                  title="No Job Cards Found"
                  description="No job cards match the filtered criteria."
                />
              ) : (
                <div className="space-y-4">
                  <DataTable columns={columns} data={cardsList} />

                  {/* Pagination */}
                  {jobCardsData && jobCardsData.totalPages > 1 && (
                    <Pagination
                      page={page}
                      totalPages={jobCardsData.totalPages}
                      onPageChange={setPage}
                    />
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Execution Side Drawer */}
          <JobExecutionDrawer
            open={drawerOpen}
            onOpenChange={setDrawerOpen}
            job={selectedJob}
          />
        </div>
      </QueryStateWrapper>
    </ProtectedRoute>
  );
}
