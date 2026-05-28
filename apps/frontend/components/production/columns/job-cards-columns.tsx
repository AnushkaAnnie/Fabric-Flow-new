'use client';

import { ColumnDef } from '@tanstack/react-table';
import { JobCard } from '@/types/production';
import { StatusBadge } from '../status-badge';

export const jobCardColumns: ColumnDef<JobCard>[] = [
  {
    accessorKey: 'jobCardNo',
    header: 'Job Card',
  },
  {
    accessorKey: 'machineNo',
    header: 'Machine',
  },
  {
    accessorKey: 'operatorName',
    header: 'Operator',
  },
  {
    accessorKey: 'shift',
    header: 'Shift',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <StatusBadge status={row.original.status} />
    ),
  },
];
