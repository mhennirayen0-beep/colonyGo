'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function SalesViewPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-bold text-primary">Sales Management</h1>
        <p className="text-sm text-muted-foreground">
          View mode (analytics). In Part 3 we will add: pipeline snake, won/lost, client bubbles, volume by category,
          workload, and the sales committee Kanban.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Pipeline evolution (snake)</CardTitle>
            <CardDescription>Clickable segments (Prospection / Discovery / Evaluation / Deal).</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Coming in Part 3.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Won vs Lost</CardTitle>
            <CardDescription>Balance chart with click-through to details.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Coming in Part 3.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Client profiling bubbles</CardTitle>
            <CardDescription>Reactivity vs reliability. Bubble size = volume.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Coming in Part 3.</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Sales committee Kanban</CardTitle>
            <CardDescription>À faire / En cours / Validé / Clos.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">Coming in Part 3.</CardContent>
        </Card>
      </div>
    </div>
  );
}
