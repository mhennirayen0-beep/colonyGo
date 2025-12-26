'use client';

import { OpportunityTable } from '@/components/opportunities/opportunity-table';
import type { Opportunity } from '@/lib/types';
import { ActionsToFollowTable } from './actions-to-follow-table';
import { AlertsTable } from './alerts-table';
import { NewsFeedTable } from './news-feed-table';

export function SalesDataView({ onEdit }: { onEdit: (opportunity: Opportunity) => void }) {
  return (
    <div className="space-y-6">
      <OpportunityTable onEdit={onEdit} />
      <ActionsToFollowTable />
      <AlertsTable />
      <NewsFeedTable />
    </div>
  );
}
