'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      router.replace('/login');
      return;
    }

    const timer = setTimeout(() => {
      setAuthorized(true);
    }, 0);

    return () => clearTimeout(timer);
  }, [router]);

  if (!authorized) {
    return null;
  }

  return children;
}
