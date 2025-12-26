'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export type SalesMode = 'data' | 'view';

function setParam(searchParams: URLSearchParams, key: string, value: string) {
  const next = new URLSearchParams(searchParams.toString());
  next.set(key, value);
  return next;
}

export function SalesModeToggle({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const mode = useMemo<SalesMode>(() => {
    const m = (sp.get('mode') ?? 'data') as SalesMode;
    return m === 'view' ? 'view' : 'data';
  }, [sp]);

  const go = (m: SalesMode) => {
    const next = setParam(sp as unknown as URLSearchParams, 'mode', m);
    router.replace(`${pathname}?${next.toString()}`);
  };

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
