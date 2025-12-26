"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Opportunity } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

function formatCurrency(value: number) {
  const n = Number(value || 0);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "TND",
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return String(Math.round(n));
  }
}

function PhaseBadge({ phase }: { phase: Opportunity["opportunityphase"] }) {
  if (phase === "Prospection") return <Badge variant="secondary">Prospection</Badge>;
  if (phase === "Discovery") return <Badge className="bg-[hsl(var(--info))] text-white">Discovery</Badge>;
  if (phase === "Evaluation") return <Badge className="bg-[hsl(var(--accent))] text-black">Evaluation</Badge>;
  if (phase === "Deal") return <Badge variant="outline">Deal</Badge>;
  return <Badge variant="outline">{String(phase)}</Badge>;
}

type OpportunityDrilldownSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  opportunities: Opportunity[];
  ctaHref?: string;
  ctaLabel?: string;
};

export function OpportunityDrilldownSheet({
  open,
  onOpenChange,
  title,
  description,
  opportunities,
  ctaHref,
  ctaLabel = "Open in Sales Management",
}: OpportunityDrilldownSheetProps) {
  const totals = useMemo(() => {
    const totalForecast = opportunities.reduce((sum, o) => sum + (Number(o.value_forecast) || 0), 0);
    const totalCount = opportunities.length;
    return { totalForecast, totalCount };
  }, [opportunities]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="font-headline">{title}</SheetTitle>
          <SheetDescription>
            {description ?? `${totals.totalCount} opportunities · Forecast ${formatCurrency(totals.totalForecast)}`}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 flex items-center gap-2">
          {ctaHref ? (
            <Button asChild variant="accent">
              <Link href={ctaHref}>{ctaLabel}</Link>
            </Button>
          ) : null}
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>

        <div className="mt-6 max-h-[70vh] overflow-y-auto rounded-xl border bg-background">
          {opportunities.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">No opportunities found for this selection.</div>
          ) : (
            <div className="divide-y">
              {opportunities.map((o) => (
                <div key={o.id} className="flex items-start justify-between gap-3 p-4 hover:bg-muted/40">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/opportunities/${o.id}`} className="truncate font-medium hover:underline">
                        {o.opportunityname}
                      </Link>
                      <PhaseBadge phase={o.opportunityphase} />
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      <span className="truncate">Client: {o.customername}</span>
                      <span className="truncate">Owner: {o.opportunityowner}</span>
                      <span className="truncate">Status: {o.opportunitystatut}</span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="text-sm font-semibold text-primary">{formatCurrency(o.value_forecast)}</div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/opportunities/${o.id}`}>View</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
