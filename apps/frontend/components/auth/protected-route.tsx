'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getSupabaseSession, subscribeToAuthChanges } from '@/lib/auth';

interface Props {
  children: React.ReactNode;
}

/**
 * Client-side route guard. Checks the Supabase session on mount and subscribes
 * to auth state changes for the lifetime of the component.
 *
 * NOTE: Next.js middleware cannot run in static-export mode (output: 'export').
 * All route protection is therefore handled here, client-side.
 */
export function ProtectedRoute({ children }: Props) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Perform the initial session check
    getSupabaseSession()
      .then((session) => {
        if (cancelled) return;
        if (!session) {
          router.replace('/login');
        } else {
          setAuthed(true);
        }
      })
      .catch(() => {
        if (!cancelled) router.replace('/login');
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });

    // Stay reactive to future sign-outs (e.g. token expiry, sign-out in another tab)
    const {
      data: { subscription },
    } = subscribeToAuthChanges((_event, session) => {
      if (!session) {
        setAuthed(false);
        router.replace('/login');
      } else {
        setAuthed(true);
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
      </div>
    );
  }

  if (!authed) {
    // Redirect is in-flight; render nothing to avoid flashing protected content
    return null;
  }

  return <>{children}</>;
}
