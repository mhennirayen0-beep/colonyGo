'use client';

import Link from "next/link";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import type { Opportunity } from "@/lib/types";

export function DrilldownSheet({
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
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="font-headline">{title}</SheetTitle>
        </SheetHeader>

        <div className="mt-4">
          <div className="text-sm text-muted-foreground">
            {opportunities.length} opportunité(s)
          </div>

          <ScrollArea className="mt-3 h-[75vh] pr-4">
            <div className="space-y-2">
              {opportunities.map((o) => (
                <Link
                  key={o.id}
                  href={`/opportunities/${o.id}`}
                  className="block rounded-xl border bg-card p-3 hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{o.opportunityname}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {o.customername} · {o.opportunityowner}
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {o.opportunityphase}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );
}
