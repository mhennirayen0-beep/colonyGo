'use client';

import { useMemo } from 'react';
import { Pie, PieChart, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import { cn } from '@/lib/utils';

type Datum = { name: 'Won' | 'Lost'; value: number };

export function WonLostBalanceChart({
  won,
  lost,
  active,
  onPick,
  className,
}: {
  won: number;
  lost: number;
  active?: 'Won' | 'Lost';
  onPick?: (v: 'Won' | 'Lost') => void;
  className?: string;
}) {
  const data = useMemo<Datum[]>(() => ([
    { name: 'Won', value: won },
    { name: 'Lost', value: lost },
  ]), [won, lost]);

  return (
    <div className={cn('h-44 w-full', className)}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip />
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={44}
            outerRadius={70}
            stroke="hsl(var(--border))"
            onClick={(d: any) => onPick?.(d?.name)}
          >
            {/* No hard-coded colors; use CSS variables via className on wrapper */}
            {data.map((d) => (
              <Cell
                key={d.name}
                className={cn(
                  d.name === 'Won' ? 'fill-primary' : 'fill-destructive',
                  active === d.name && 'opacity-100',
                  active && active !== d.name && 'opacity-40'
                )}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
