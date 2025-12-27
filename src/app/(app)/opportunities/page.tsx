'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PlusCircle } from 'lucide-react';
import { subDays } from 'date-fns';

import { Button } from '@/components/ui/button';
import type { Opportunity, RagStatus } from '@/lib/types';

import { salesActions, salesAlerts, salesNewsFeed } from '@/lib/data';
import { OpportunityDialog } from '@/components/opportunities/opportunity-dialog';
import { useOpportunitiesStore } from '@/lib/opportunities-store';
import { useCustomers } from '@/hooks/use-customers';
import { useAbility } from '@/lib/ability';
import { useToast } from '@/hooks/use-toast';

import { SalesModeToggle } from '@/components/sales-management/sales-mode-toggle';
import { SalesSectionToggle } from '@/components/sales-management/sales-section-toggle';
import { SalesFiltersBar, type SalesFilters } from '@/components/sales-management/sales-filters-bar';
import { SalesDataView } from '@/components/sales-management/sales-data-view';
import { SalesViewDashboard } from '@/components/sales-management/sales-view-dashboard';
import { SalesCrmView } from '@/components/sales-management/sales-crm-view';


function uniq(arr: string[]) {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
}

export default function OpportunitiesPage() {
  const { toast } = useToast();
  const ability = useAbility();
  const { customers } = useCustomers();
  const { opportunities, loading } = useOpportunitiesStore();
  const sp = useSearchParams();
  const mode = (sp.get('mode') ?? 'data') === 'view' ? 'view' : 'data';
  const tab = (sp.get('tab') ?? 'sales') === 'crm' ? 'crm' : 'sales';

  const [filters, setFilters] = useState<SalesFilters>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

  const customerNameById = useMemo(() => new Map(customers.map((c) => [c.id, c.name] as const)), [customers]);
  const allOpportunities = useMemo(
    () => opportunities.map((o) => ({ ...o, customername: o.customername || customerNameById.get(o.customerid) || o.customerid })),
    [opportunities, customerNameById]
  );

  const owners = useMemo(() => uniq(allOpportunities.map((o) => o.opportunityowner)), [allOpportunities]);
  const clients = useMemo(() => uniq(allOpportunities.map((o) => o.customername)), [allOpportunities]);

  const periodStart = useMemo(() => {
    const p = filters.period ?? 'all';
    if (p === '7d') return subDays(new Date(), 7);
    if (p === '30d') return subDays(new Date(), 30);
    if (p === '90d') return subDays(new Date(), 90);
    return null;
  }, [filters.period]);

  const inPeriod = (iso?: string | null) => {
    if (!periodStart) return true;
    if (!iso) return true;
    const d = new Date(iso);
    return d.getTime() >= periodStart.getTime();
  };

  const oppById = useMemo(() => {
    const map = new Map<string, Opportunity>();
    allOpportunities.forEach((o) => map.set(o.id, o));
    return map;
  }, []);

  const oppByName = useMemo(() => {
    const map = new Map<string, Opportunity>();
    allOpportunities.forEach((o) => map.set(o.opportunityname, o));
    return map;
  }, []);

  const filteredOpps = useMemo(() => {
    const q = (filters.query ?? '').trim().toLowerCase();
    return allOpportunities.filter((o) => {
      if (!inPeriod(o.createdAtISO)) return false;
      if (filters.owner && o.opportunityowner !== filters.owner) return false;
      if (filters.client && o.customername !== filters.client) return false;
      if (!q) return true;
      const hay = `${o.id} ${o.opportunityname} ${o.opportunitydescription} ${o.customername} ${o.customerid} ${o.opportunityowner}`.toLowerCase();
      return hay.includes(q);
    });
  }, [filters, periodStart]);

  const openNew = () => {
    if (!ability.can('create', 'Opportunity')) {
      toast({ title: 'Not allowed', description: 'You do not have permission to create opportunities.', variant: 'destructive' });
      return;
    }
    setSelectedOpp(null);
    setDialogOpen(true);
  };

  const openEdit = (o: Opportunity) => {
    if (!ability.can('update', 'Opportunity')) {
      toast({ title: 'Not allowed', description: 'You do not have permission to edit opportunities.', variant: 'destructive' });
      return;
    }
    setSelectedOpp(o);
    setDialogOpen(true);
  };

  const filteredActions = useMemo(() => {
    const q = (filters.query ?? '').trim().toLowerCase();
    return salesActions.filter((a) => {
      const opp = oppById.get(a.opportunityid);
      if (!inPeriod(opp?.createdAtISO)) return false;
      if (filters.owner && a.salesowner !== filters.owner) return false;
      if (filters.client && a.clientname !== filters.client) return false;
      if (!q) return true;
      const hay = `${a.opportunityid} ${a.title} ${a.clientname} ${a.currentaction} ${a.salesowner}`.toLowerCase();
      return hay.includes(q);
    });
  }, [filters, periodStart, oppById]);

  const filteredAlerts = useMemo(() => {
    const q = (filters.query ?? '').trim().toLowerCase();
    return salesAlerts.filter((a) => {
      const opp = oppByName.get(a.opportunityname);
      if (!inPeriod(opp?.createdAtISO)) return false;
      if (filters.owner && a.salesowner !== filters.owner) return false;
      if (!q) return true;
      const hay = `${a.opportunityname} ${a.currentaction} ${a.salesowner}`.toLowerCase();
      return hay.includes(q);
    });
  }, [filters, periodStart, oppByName]);

  const filteredNews = useMemo(() => {
    const q = (filters.query ?? '').trim().toLowerCase();
    return salesNewsFeed.filter((n) => {
      if (!inPeriod(n.timestampISO)) return false;
      if (filters.owner && n.salesowner !== filters.owner) return false;
      if (filters.client && n.clientname !== filters.client) return false;
      if (!q) return true;
      const hay = `${n.opportunityid} ${n.actioncompleted} ${n.clientname} ${n.salesowner}`.toLowerCase();
      return hay.includes(q);
    });
  }, [filters, periodStart]);

  const getRagForActionTitle = (title: string): RagStatus => {
    const a = salesAlerts.find((x) => x.opportunityname === title);
    if (!a) return 'green';
    if (a.delay_days >= 30) return 'red';
    if (a.delay_days >= 15) return 'orange';
    return 'green';
  };

  const handleNewOpportunity = () => {
    if (!ability.can('create', 'Opportunity')) {
      toast({ title: 'Not allowed', description: 'You do not have permission to create opportunities.', variant: 'destructive' });
      return;
    }
    setSelectedOpp(null);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedOpp(null);
  };

  return (
    <div className="space-y-6">
      {/* Mobile: mode toggle inside page */}
      <div className="flex flex-col gap-3 md:hidden">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-headline text-2xl font-bold text-primary">Sales Management</h1>
          <div className="flex items-center gap-2">
            <SalesSectionToggle />
            {tab === 'sales' && <SalesModeToggle />}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-headline text-3xl font-bold text-primary">Sales Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === 'crm'
              ? 'CRM prototype (accounts overview driven from opportunities)'
              : mode === 'data'
                ? 'Data view (tables + exports)'
                : 'View mode (dashboard + committee)'}
          </p>
        </div>

        {tab === 'sales' && mode === 'data' && (
          <Button onClick={handleNewOpportunity} variant="accent" disabled={loading || !ability.can('create', 'Opportunity')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Opportunity
          </Button>
        )}
      </div>

      <SalesFiltersBar owners={owners} clients={clients} value={filters} onChange={setFilters} />

      {tab === 'crm' ? (
        <SalesCrmView opportunities={filteredOpps} alerts={filteredAlerts} />
      ) : mode === 'data' ? (
        <SalesDataView
          opportunities={filteredOpps}
          actions={filteredActions}
          alerts={filteredAlerts}
          news={filteredNews}
          getRagForActionTitle={getRagForActionTitle}
        />
      ) : (
        <SalesViewDashboard opportunities={filteredOpps} alerts={filteredAlerts} />
      )}

      <OpportunityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        opportunity={selectedOpp}
        onFormSubmit={handleDialogClose}
      />
    </div>
  );
}
