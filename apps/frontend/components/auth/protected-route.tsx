'use client';

import { getSupabaseSession, subscribeToAuthChanges } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Props {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: Props) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const session = await getSupabaseSession();
        if (!mounted) return;

        if (!session) {
          setAuthorized(false);
          router.replace('/login');
          return;
        }

        setAuthorized(true);
      } catch {
        if (!mounted) return;
        setAuthorized(false);
        router.replace('/login');
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    }

    void checkSession();

    const {
      data: { subscription },
    } = subscribeToAuthChanges((_event, session) => {
      if (!mounted) return;

      if (!session) {
        setAuthorized(false);
        router.replace('/login');
        return;
      }

      setAuthorized(true);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080c14]">
        <div className="animate-pulse text-sm font-medium text-slate-500">
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
