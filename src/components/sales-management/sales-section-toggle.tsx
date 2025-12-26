'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type SalesSection = 'sales' | 'crm';

function setParam(searchParams: URLSearchParams, key: string, value: string) {
  const next = new URLSearchParams(searchParams.toString());
  next.set(key, value);
  return next;
}

/**
 * Sub-category switch for Colony Sales: Sales Management vs CRM.
 * Uses URL param `tab=sales|crm`.
 */
export function SalesSectionToggle({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const tab = useMemo<SalesSection>(() => {
    const t = (sp.get('tab') ?? 'sales') as SalesSection;
    return t === 'crm' ? 'crm' : 'sales';
  }, [sp]);

  const go = (t: SalesSection) => {
    let next = setParam(sp as unknown as URLSearchParams, 'tab', t);
    // default mode when switching tabs
    if (!next.get('mode')) next = setParam(next, 'mode', 'data');
    router.replace(`${pathname}?${next.toString()}`);
  };

  return (
    <div className={cn('inline-flex items-center gap-1 rounded-2xl border bg-background p-1 shadow-sm', className)}>
      <Button
        size="sm"
        variant={tab === 'sales' ? 'default' : 'ghost'}
        className={cn('rounded-xl px-4', tab === 'sales' && 'shadow-sm')}
        onClick={() => go('sales')}
      >
        Sales
      </Button>
      <Button
        size="sm"
        variant={tab === 'crm' ? 'default' : 'ghost'}
        className={cn('rounded-xl px-4', tab === 'crm' && 'shadow-sm')}
        onClick={() => go('crm')}
      >
        CRM
      </Button>
    </div>
  );
}
