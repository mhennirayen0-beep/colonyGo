"use client";

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { salesPipelineData } from "@/lib/data";
import type { Opportunity } from '@/lib/types';
import { OpportunityDrilldownSheet } from "@/components/dashboard/opportunity-drilldown-sheet";

const chartConfig = {
  value: {
    label: "Opportunities",
    color: "hsl(var(--primary))",
  },
};

export function SalesPipelineChart({
  opportunities,
  data,
}: {
  opportunities: Opportunity[];
  data?: Array<{ name: string; value: number }>;
}) {
  const [open, setOpen] = useState(false);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const selectedOpportunities = useMemo(() => {
    if (!selectedStage) return [];
    return opportunities.filter((o) => String(o.opportunityphase) === String(selectedStage));
  }, [selectedStage, opportunities]);

  const chartData = data && Array.isArray(data) && data.length ? data : salesPipelineData;

  const handleBarClick = (data: any) => {
    const stage = data?.payload?.name ?? data?.name;
    if (!stage) return;
    setSelectedStage(String(stage));
    setOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Sales Pipeline</CardTitle>
          <CardDescription>
            Opportunities by stage · <span className="text-primary">click a bar</span> to see details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid horizontal={false} />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} />
                <XAxis type="number" hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar
                  dataKey="value"
                  fill="var(--color-value)"
                  radius={4}
                  onClick={handleBarClick}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <OpportunityDrilldownSheet
        open={open}
        onOpenChange={setOpen}
        title={selectedStage ? `Pipeline · ${selectedStage}` : "Pipeline"}
        opportunities={selectedOpportunities}
        ctaHref={selectedStage ? `/opportunities?mode=data&phase=${encodeURIComponent(selectedStage)}` : undefined}
        ctaLabel="Open filtered list"
      />
    </>
  );
}
