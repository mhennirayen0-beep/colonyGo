import { StatsCards } from "@/components/dashboard/stats-cards";
import { SalesPipelineChart } from "@/components/dashboard/sales-pipeline-chart";
import { WonLostChart } from "@/components/dashboard/won-lost-chart";
import { NewsFeed } from "@/components/dashboard/news-feed";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-headline font-bold text-primary">Dashboard</h1>
      
      <StatsCards />

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
