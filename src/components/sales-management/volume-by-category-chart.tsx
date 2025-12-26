'use client';

import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type Row = { name: string; Hardware: number; Software: number; Services: number };

export function VolumeByCategoryChart({ data }: { data: Row[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Business volume by category</CardTitle>
        <CardDescription>Hardware / Software / Services</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Hardware" stackId="a" fill="hsl(var(--primary))" />
              <Bar dataKey="Software" stackId="a" fill="hsl(var(--ring))" />
              <Bar dataKey="Services" stackId="a" fill="hsl(var(--accent))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
