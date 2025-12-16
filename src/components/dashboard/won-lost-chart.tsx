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

const chartData = [
  { status: "Won", count: 25, fill: "hsl(var(--primary))" },
  { status: "Lost", count: 10, fill: "hsl(var(--destructive))" },
]

const chartConfig = {
  count: {
    label: "Count",
  },
  Won: {
    label: "Won",
    color: "hsl(var(--primary))",
  },
  Lost: {
    label: "Lost",
    color: "hsl(var(--destructive))",
  },
}

export function WonLostChart() {
  const total = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.count, 0)
  }, [])

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline">Won vs. Lost</CardTitle>
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
