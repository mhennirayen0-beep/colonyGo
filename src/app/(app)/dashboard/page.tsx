import { StatsCards } from "@/components/dashboard/stats-cards";
import { SalesPipelineChart } from "@/components/dashboard/sales-pipeline-chart";
import { WonLostChart } from "@/components/dashboard/won-lost-chart";
import { NewsFeed } from "@/components/dashboard/news-feed";
import { DollarSign, TrendingUp, Target, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { opportunities } from "@/lib/data";

function QuickStats() {
  const activeOpportunities = opportunities.filter(o => o.opportunitystatut === 'Start' || o.opportunitystatut === 'Forecast').length;
  const totalPipelineValue = opportunities.reduce((acc, opp) => acc + opp.value_forecast, 0);
  const wonCount = opportunities.filter(o => o.opportunitystatut === 'Start').length;
  const totalClosed = opportunities.filter(o => o.opportunitystatut === 'Start' || o.opportunitystatut === 'Stop' || o.opportunitystatut === 'Cancelled').length;
  const conversionRate = totalClosed > 0 ? ((wonCount / totalClosed) * 100).toFixed(0) : 0;
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };


  const stats = [
    { title: "Opportunités Actives", value: activeOpportunities, icon: TrendingUp, color: "text-status-start" },
    { title: "Valeur Pipeline", value: formatCurrency(totalPipelineValue), icon: DollarSign, color: "text-status-forecast" },
    { title: "Taux de Conversion", value: `${conversionRate}%`, icon: Target, color: "text-status-stop" },
    { title: "Alertes Urgentes", value: 1, icon: AlertTriangle, color: "text-status-cancelled" },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
      {stats.map(stat => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className={`h-4 w-4 text-muted-foreground ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}


export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline font-bold text-primary">Dashboard</h1>
      
      <QuickStats />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="lg:col-span-2">
            <SalesPipelineChart />
        </div>
        <WonLostChart />
      </div>

      <NewsFeed />
    </div>
  );
}
