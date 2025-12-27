"use client";

import * as React from "react";
import { Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import type { Opportunity } from '@/lib/types';
import { OpportunityDrilldownSheet } from "@/components/dashboard/opportunity-drilldown-sheet";

const chartConfig = {
  count: {
    label: "Count",
  },
  Gagnées: {
    label: "Gagnées",
    color: "hsl(var(--accent))",
  },
  Perdues: {
    label: "Perdues",
    color: "hsl(var(--destructive))",
  },
};

function isWon(o: any) {
  return o.opportunitystatut === "Start";
}

function isLost(o: any) {
  return o.opportunitystatut === "Stop" || o.opportunitystatut === "Cancelled";
}

export function WonLostChart({
  opportunities,
  won,
  lost,
}: {
  opportunities: Opportunity[];
  won?: number;
  lost?: number;
}) {
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<"Gagnées" | "Perdues" | null>(null);

  const wonOpps = React.useMemo(() => opportunities.filter(isWon), [opportunities]);
  const lostOpps = React.useMemo(() => opportunities.filter(isLost), [opportunities]);

  const chartData = [
    { status: "Gagnées", count: typeof won === 'number' ? won : wonOpps.length, fill: "var(--color-Gagnées)" },
    { status: "Perdues", count: typeof lost === 'number' ? lost : lostOpps.length, fill: "var(--color-Perdues)" },
  ];

  const selectedOpps = React.useMemo(() => {
    if (selected === "Gagnées") return wonOpps;
    if (selected === "Perdues") return lostOpps;
    return [];
  }, [selected, wonOpps, lostOpps]);

  const handleSliceClick = (data: any) => {
    const status = data?.status ?? data?.payload?.status;
    if (status !== "Gagnées" && status !== "Perdues") return;
    setSelected(status);
    setOpen(true);
  };

  return (
    <>
      <Card className="flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline">Balance Gagnées vs Perdues</CardTitle>
          <CardDescription>
            Ratio of won to lost opportunities · <span className="text-primary">click a slice</span> to see details
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-1 pb-0">
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie
                  data={chartData}
                  dataKey="count"
                  nameKey="status"
                  innerRadius={60}
                  strokeWidth={5}
                  onClick={handleSliceClick}
                />
                <ChartLegend content={<ChartLegendContent nameKey="status" />} />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <OpportunityDrilldownSheet
        open={open}
        onOpenChange={setOpen}
        title={selected ? `Opportunities · ${selected}` : "Opportunities"}
        opportunities={selectedOpps}
        ctaHref={
          selected === 'Gagnées'
            ? `/opportunities?mode=data&status=${encodeURIComponent('Start')}`
            : selected === 'Perdues'
              ? `/opportunities?mode=data&status=${encodeURIComponent('Stop')}`
              : undefined
        }
        ctaLabel="Open filtered list"
      />
    </>
  );
}
