'use client';

import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type Row = { owner: string; opps: number; value: number; winRate: number };

export function WorkloadChart({ data }: { data: Row[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Workload & performance</CardTitle>
        <CardDescription>Opportunities count + forecast value (win rate in tooltip)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="owner" tick={{ fontSize: 11 }} interval={0} height={60} angle={-20} />
              <YAxis />
              <Tooltip formatter={(v: any) => v} />
              <Bar dataKey="opps" fill="hsl(var(--primary))" radius={4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
