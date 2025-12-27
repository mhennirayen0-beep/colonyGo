'use client';

import { DollarSign, TrendingUp, Target, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SalesPipelineChart } from '@/components/dashboard/sales-pipeline-chart';
import { WonLostChart } from '@/components/dashboard/won-lost-chart';
import { NewsFeed } from '@/components/dashboard/news-feed';
import { useDashboardSummary } from '@/hooks/use-dashboard-summary';
import { useOpportunitiesStore } from '@/lib/opportunities-store';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value ?? 0);
}

export default function DashboardPage() {
  const { data, loading, error } = useDashboardSummary();
  const { opportunities } = useOpportunitiesStore();

  const quick = data?.quickStats;
  const pipelineData = data?.pipelineByPhase?.map((x) => ({ name: x.phase, value: x.count })) ?? [];
  const won = data?.wonLost ? data.wonLost.won : undefined;
  const lost = data?.wonLost ? data.wonLost.stop + data.wonLost.cancelled : undefined;

  const stats = [
    {
      title: 'Opportunités Actives',
      value: quick ? quick.activeOpportunities : '—',
      icon: TrendingUp,
      color: 'text-status-start',
    },
    {
      title: 'Valeur Pipeline',
      value: quick ? formatCurrency(quick.totalPipelineValue) : '—',
      icon: DollarSign,
      color: 'text-status-forecast',
    },
    {
      title: 'Taux de Conversion',
      value: quick ? `${quick.conversionRate}%` : '—',
      icon: Target,
      color: 'text-status-stop',
    },
    {
      title: 'Alertes Urgentes',
      value: quick ? quick.urgentAlerts : '—',
      icon: AlertTriangle,
      color: 'text-status-cancelled',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline font-bold text-primary">Dashboard</h1>

      {error ? (
        <div className="rounded-2xl border bg-card p-3 text-sm text-destructive">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? '…' : stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SalesPipelineChart opportunities={opportunities} data={pipelineData} />
        </div>
        <WonLostChart opportunities={opportunities} won={won} lost={lost} />
      </div>

      <NewsFeed items={data?.news} />
    </div>
  );
}
