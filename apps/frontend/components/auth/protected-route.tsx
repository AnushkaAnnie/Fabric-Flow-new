'use client';

interface Props {
  children: React.ReactNode;
}

// Auth temporarily disabled — always renders children.
export function ProtectedRoute({ children }: Props) {
  return <>{children}</>;
}
