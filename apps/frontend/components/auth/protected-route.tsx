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
