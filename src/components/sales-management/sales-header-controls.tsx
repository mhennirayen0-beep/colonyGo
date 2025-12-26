'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function replaceQuery(router: ReturnType<typeof useRouter>, pathname: string, params: URLSearchParams) {
  const q = params.toString();
  router.replace(q ? `${pathname}?${q}` : pathname);
}

export function SalesHeaderControls() {
  const pathname = usePathname();
  const router = useRouter();
  const sp = useSearchParams();

  const isSalesModule = pathname.startsWith('/opportunities');
  const mode = (sp.get('mode') ?? 'data') as 'data' | 'view';
  const tab = (sp.get('tab') ?? 'sales') as 'sales' | 'crm';

  const params = useMemo(() => new URLSearchParams(sp.toString()), [sp]);

  if (!isSalesModule) return null;

  return (
    <div className="flex flex-col items-center gap-2">
      <Tabs
        value={tab}
        onValueChange={(v) => {
          const p = new URLSearchParams(params.toString());
          p.set('tab', v);
          replaceQuery(router, pathname, p);
        }}
      >
        <TabsList className="h-9">
          <TabsTrigger value="sales">Colony Sales</TabsTrigger>
          <TabsTrigger value="crm">CRM</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="flex items-center rounded-xl border bg-background p-0.5">
        <Button
          type="button"
          variant={mode === 'data' ? 'default' : 'ghost'}
          className={cn('h-8 rounded-lg px-4', mode !== 'data' && 'text-muted-foreground')}
          onClick={() => {
            const p = new URLSearchParams(params.toString());
            p.set('mode', 'data');
            replaceQuery(router, pathname, p);
          }}
        >
          Data
        </Button>
        <Button
          type="button"
          variant={mode === 'view' ? 'default' : 'ghost'}
          className={cn('h-8 rounded-lg px-4', mode !== 'view' && 'text-muted-foreground')}
          onClick={() => {
            const p = new URLSearchParams(params.toString());
            p.set('mode', 'view');
            replaceQuery(router, pathname, p);
          }}
        >
          View
        </Button>
      </div>
    </div>
  );
}
