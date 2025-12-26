'use client';

import { Scatter, ScatterChart, XAxis, YAxis, ZAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

type Point = { client: string; reactivity: number; reliability: number; volume: number };

type Props = {
  data: Point[];
};

export function ClientBubbleChart({ data }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Client profiling</CardTitle>
        <CardDescription>Reactivity vs payment reliability (bubble size = business volume)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
              <XAxis type="number" dataKey="reactivity" name="Reactivity" domain={[0, 100]} />
              <YAxis type="number" dataKey="reliability" name="Reliability" domain={[0, 100]} />
              <ZAxis type="number" dataKey="volume" range={[80, 450]} name="Volume" />
              <Tooltip
                cursor={{ strokeDasharray: '3 3' }}
                formatter={(v: any, key: any) => [v, key]}
                labelFormatter={(label) => `Client: ${label}`}
              />
              <Scatter data={data} name="Clients" fill="hsl(var(--primary))" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
