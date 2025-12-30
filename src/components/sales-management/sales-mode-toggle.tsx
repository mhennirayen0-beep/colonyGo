'use client';

import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type SalesMode = 'data' | 'view';

function readModeFromUrl(): SalesMode {
  if (typeof window === 'undefined') return 'data';
  const m = new URLSearchParams(window.location.search).get('mode');
  return m === 'view' ? 'view' : 'data';
}

function patchHistoryOnce() {
  if (typeof window === 'undefined') return () => {};

  const w = window as any;
  if (w.__colonygo_history_patched) return () => {};
  w.__colonygo_history_patched = true;

  const fire = () => window.dispatchEvent(new Event('colonygo:locationchange'));

  const origPush = history.pushState;
  const origReplace = history.replaceState;

  history.pushState = function (...args) {
    const ret = origPush.apply(this, args as any);
    fire();
    return ret;
  } as any;

  history.replaceState = function (...args) {
    const ret = origReplace.apply(this, args as any);
    fire();
    return ret;
  } as any;

  window.addEventListener('popstate', fire);

  return () => {
    window.removeEventListener('popstate', fire);
  };
}

/**
 * Sales top-center toggle (Data / View).
 * IMPORTANT: we intentionally avoid `useSearchParams()` to prevent the
 * Next.js build error: "useSearchParams() should be wrapped in a suspense boundary".
 */
export function SalesModeToggle({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const [mode, setMode] = useState<SalesMode>('data');

  useEffect(() => {
    const cleanup = patchHistoryOnce();
    const sync = () => setMode(readModeFromUrl());
    sync();
    window.addEventListener('colonygo:locationchange', sync);
    return () => {
      window.removeEventListener('colonygo:locationchange', sync);
      cleanup();
    };
  }, [pathname]);

  const go = (m: SalesMode) => {
    if (typeof window === 'undefined') return;
    const next = new URLSearchParams(window.location.search);
    next.set('mode', m);
    setMode(m);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const isSalesPage = useMemo(
    () => pathname.startsWith('/opportunities') || pathname.startsWith('/crm'),
    [pathname]
  );

  if (!isSalesPage) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-2xl border bg-background p-1 shadow-sm',
        className
      )}
    >
      <Button
        size="sm"
        variant={mode === 'data' ? 'default' : 'ghost'}
        className={cn('rounded-xl px-4', mode === 'data' && 'shadow-sm')}
        onClick={() => go('data')}
      >
        Data
      </Button>
      <Button
        size="sm"
        variant={mode === 'view' ? 'default' : 'ghost'}
        className={cn('rounded-xl px-4', mode === 'view' && 'shadow-sm')}
        onClick={() => go('view')}
      >
        View
      </Button>
    </div>
  );
}
