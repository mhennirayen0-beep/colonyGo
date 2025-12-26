'use client';

import { ViewCard } from './view-card';
import { PipelineSnake } from './pipeline-snake';
import { WonLostBalance } from './won-lost-balance';
import { ClientBubbleChart } from './client-bubble-chart';
import { VolumeByCategory } from './volume-by-category';
import { WorkloadPerformance } from './workload-performance';
import { SalesCommitteeKanban } from './sales-committee-kanban';

export function SalesViewDashboard() {
  return (
    <div className="space-y-6">
      <ViewCard id="view-pipeline" title="Pipeline Snake" subtitle="Pipeline volume by phase">
        <PipelineSnake />
      </ViewCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <ViewCard id="view-wonlost" title="Won vs Lost Balance" subtitle="Counts + pipeline amount per bucket">
          <WonLostBalance />
        </ViewCard>

        <ViewCard id="view-volume" title="Volume by Category" subtitle="Stacked by phase (Hardware / Software / Service)">
          <VolumeByCategory />
        </ViewCard>
      </div>

      <ViewCard id="view-bubble" title="Client Bubble Chart" subtitle="Reactivity vs payment reliability (bubble size = volume)">
        <ClientBubbleChart />
      </ViewCard>

      <ViewCard id="view-workload" title="Workload & Performance" subtitle="Pipeline value and action load by salesperson">
        <WorkloadPerformance />
      </ViewCard>

      <ViewCard id="view-kanban" title="Sales Committee Kanban" subtitle="From opportunity phases/statuses">
        <SalesCommitteeKanban />
      </ViewCard>
    </div>
  );
}
