'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BarChart3, Database } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Mode = 'data' | 'view';

function buildUrl(pathname: string, params: URLSearchParams) {
  const q = params.toString();
  return q ? `${pathname}?${q}` : pathname;
}

/**
 * Sales Management top-center toggle (Data / View).
 * Spec: centered at top. We keep the state in query param `mode`.
 */
export function SalesModeToggle({ className }: { className?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = (searchParams.get('mode') as Mode) ?? 'data';
  const active: Mode = mode === 'view' ? 'view' : 'data';

  const setMode = (m: Mode) => {
    const next = new URLSearchParams(searchParams.toString());
    next.set('mode', m);
    router.push(buildUrl(pathname, next));
  };

  const isOpportunitiesRoot = useMemo(() => pathname === '/opportunities', [pathname]);

  // Only show on /opportunities root (not details pages)
  if (!isOpportunitiesRoot) return null;

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-xl border bg-background p-1 shadow-sm',
        className
      )}
      role="tablist"
      aria-label="Sales view mode"
    >
      <Button
        type="button"
        size="sm"
        variant={active === 'data' ? 'default' : 'ghost'}
        className={cn('h-9 rounded-lg px-3')}
        onClick={() => setMode('data')}
        aria-pressed={active === 'data'}
      >
        <Database className="h-4 w-4" />
        Data
      </Button>
      <Button
        type="button"
        size="sm"
        variant={active === 'view' ? 'default' : 'ghost'}
        className={cn('h-9 rounded-lg px-3')}
        onClick={() => setMode('view')}
        aria-pressed={active === 'view'}
      >
        <BarChart3 className="h-4 w-4" />
        View
      </Button>
    </div>
  );
}
