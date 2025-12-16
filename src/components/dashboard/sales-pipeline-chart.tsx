"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
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
} from "@/components/ui/chart"
import { salesPipelineData } from "@/lib/data"

const chartConfig = {
  value: {
    label: "Opportunities",
    color: "hsl(var(--primary))",
  },
}

export function SalesPipelineChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Sales Pipeline</CardTitle>
        <CardDescription>Opportunities by stage</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesPipelineData} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid horizontal={false} />
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} />
                    <XAxis type="number" hide />
                    <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                    <Bar dataKey="value" fill="var(--color-value)" radius={4} />
                </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
