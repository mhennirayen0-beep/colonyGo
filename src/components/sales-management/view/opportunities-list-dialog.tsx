'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import type { Opportunity } from '@/lib/types';

export function OpportunitiesListDialog({
  open,
  onOpenChange,
  title,
  opportunities,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  opportunities: Opportunity[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-headline">{title}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-2">
            {opportunities.map((o) => (
              <Link
                key={o.opportunityid}
                href={`/opportunities/${o.opportunityid}`}
                className="block rounded-xl border bg-background p-3 hover:bg-muted/50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{o.opportunityname}</div>
                    <div className="text-sm text-muted-foreground">{o.customername} · {o.opportunityowner}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{o.opportunityphase}</Badge>
                    <Badge variant="outline">{o.opportunitystatut}</Badge>
                  </div>
                </div>
              </Link>
            ))}
            {opportunities.length === 0 ? (
              <div className="text-sm text-muted-foreground">No items.</div>
            ) : null}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
