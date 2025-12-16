"use client"

import * as React from "react"
import { Pie, PieChart, ResponsiveContainer } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart"
import { opportunities } from "@/lib/data"


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
}

export function WonLostChart() {
  const chartData = [
    { status: "Gagnées", count: opportunities.filter(o => o.opportunitystatut === 'Start' || o.opportunitystatut === 'Forecast').length, fill: "var(--color-Gagnées)" },
    { status: "Perdues", count: opportunities.filter(o => o.opportunitystatut === 'Stop' || o.opportunitystatut === 'Cancelled').length, fill: "var(--color-Perdues)" },
  ]

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Balance Gagnées vs Perdues</CardTitle>
        <CardDescription>Ratio of won to lost opportunities this quarter</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="status"
                innerRadius={60}
                strokeWidth={5}
              >
              </Pie>
              <ChartLegend content={<ChartLegendContent nameKey="status" />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
