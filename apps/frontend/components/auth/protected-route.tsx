'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Props {
  children: React.ReactNode;
}

export function ProtectedRoute({
  children,
}: Props) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setChecking(false);
      router.replace('/login');
      return;
    }

    setAuthorized(true);
    setChecking(false);
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080c14]">
        <div className="text-slate-500 animate-pulse text-sm font-medium">
          Checking authentication...
        </div>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return children;
}
