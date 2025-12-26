import type { Opportunity, RagStatus } from '@/lib/types';
import { cn } from '@/lib/utils';

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export const phaseVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Prospection: 'outline',
  Discovery: 'secondary',
  Evaluation: 'default',
  Deal: 'outline',
};

export const statusClass: Record<string, string> = {
  Forecast: 'bg-status-forecast text-white',
  Start: 'bg-status-start text-white',
  Stop: 'bg-status-stop text-white',
  Cancelled: 'bg-status-cancelled text-white',
};

export const ragBadge = (rag: RagStatus) => {
  const cls =
    rag === 'red'
      ? 'bg-destructive text-destructive-foreground'
      : rag === 'orange'
        ? 'bg-status-stop text-white'
        : 'bg-status-start text-white';
  const label = rag === 'red' ? '🔴' : rag === 'orange' ? '🟠' : '🟢';
  return { cls, label };
};

export const totalOpportunityValue = (o: Opportunity) =>
  (o.hardware_price ?? 0) + (o.software_price ?? 0) + (o.service_price ?? 0);
