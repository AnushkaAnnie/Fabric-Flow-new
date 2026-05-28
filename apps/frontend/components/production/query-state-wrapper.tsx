'use client';

import { QueryError } from './query-error';
import { TableSkeleton } from './table-skeleton';

interface Props {
  isLoading: boolean;
  error: unknown;
  retry: () => void;
  children: React.ReactNode;
}

export function QueryStateWrapper({
  isLoading,
  error,
  retry,
  children,
}: Props) {
  if (isLoading) {
    return <TableSkeleton />;
  }

  if (error) {
    return (
      <QueryError
        message="Failed to load data."
        retry={retry}
      />
    );
  }

  return children;
}
