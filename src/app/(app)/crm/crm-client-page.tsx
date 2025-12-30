'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { subDays } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { CustomerDialog } from '@/components/customers/customer-dialog';
import { CustomerTable } from '@/components/customers/customer-table';

import { useCustomers } from '@/hooks/use-customers';
import { useToast } from '@/hooks/use-toast';
import { useAbility } from '@/lib/ability';
import { useOpportunitiesStore } from '@/lib/opportunities-store';
import type { Customer, Opportunity } from '@/lib/types';
import { salesAlerts } from '@/lib/data';

import { SalesFiltersBar, type SalesFilters } from '@/components/sales-management/sales-filters-bar';
import { SalesCrmView } from '@/components/sales-management/sales-crm-view';

type Mode = 'data' | 'view';

function uniq(arr: string[]) {
  return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
}

function ModeLinks({ basePath, mode }: { basePath: string; mode: Mode }) {
  const cls = (active: boolean) =>
    [
      'rounded-xl px-4 py-2 text-sm transition',
      active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted',
    ].join(' ');

  return (
    <div className="inline-flex items-center gap-1 rounded-2xl border bg-background p-1 shadow-sm">
      <Link className={cls(mode === 'data')} href={`${basePath}?mode=data`}>
        Data
      </Link>
      <Link className={cls(mode === 'view')} href={`${basePath}?mode=view`}>
        View
      </Link>
    </div>
  );
}

export function CrmClientPage({ mode }: { mode: Mode }) {
  const { toast } = useToast();
  const ability = useAbility();

  // CRM (Data): real customers CRUD
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;
  const { customers, meta, loading, error, createCustomer, updateCustomer, deleteCustomer } =
    useCustomers({ q: q.trim() || undefined, page, limit });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleNewCustomer = () => {
    if (!ability.can('create', 'Customer')) {
      toast({
        title: 'Not allowed',
        description: 'You do not have permission to create customers.',
        variant: 'destructive',
      });
      return;
    }
    setSelectedCustomer(null);
    setDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    if (!ability.can('update', 'Customer')) {
      toast({
        title: 'Not allowed',
        description: 'You do not have permission to edit customers.',
        variant: 'destructive',
      });
      return;
    }
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!ability.can('delete', 'Customer')) {
      toast({
        title: 'Not allowed',
        description: 'You do not have permission to delete customers.',
        variant: 'destructive',
      });
      return;
    }
    await deleteCustomer(id);
  };

  // CRM (View): keep existing opportunity-driven CRM analytics
  const { opportunities } = useOpportunitiesStore();
  const [filters, setFilters] = useState<SalesFilters>({});

  const customerNameById = useMemo(
    () => new Map(customers.map((c) => [c.id, c.name] as const)),
    [customers]
  );

  const allOpportunities = useMemo(
    () =>
      opportunities.map((o) => ({
        ...o,
        customername: o.customername || customerNameById.get(o.customerid) || o.customerid,
      })),
    [opportunities, customerNameById]
  ) as Opportunity[];

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

  const filteredOpps = useMemo(() => {
    const qq = (filters.query ?? '').trim().toLowerCase();
    return allOpportunities.filter((o) => {
      if (!inPeriod(o.createdAtISO)) return false;
      if (filters.owner && o.opportunityowner !== filters.owner) return false;
      if (filters.client && o.customername !== filters.client) return false;
      if (!qq) return true;
      const hay = `${o.id} ${o.opportunityname} ${o.opportunitydescription} ${o.customername} ${o.customerid} ${o.opportunityowner}`.toLowerCase();
      return hay.includes(qq);
    });
  }, [filters, periodStart, allOpportunities]);

  const filteredAlerts = useMemo(() => {
    const qq = (filters.query ?? '').trim().toLowerCase();
    return salesAlerts.filter((a) => {
      if (filters.owner && a.salesowner !== filters.owner) return false;
      if (!qq) return true;
      const hay = `${a.opportunityname} ${a.currentaction} ${a.salesowner}`.toLowerCase();
      return hay.includes(qq);
    });
  }, [filters]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-headline text-3xl font-bold text-primary">CRM</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === 'data' ? 'Accounts / customers management' : 'CRM view mode'}
          </p>
        </div>
        <ModeLinks basePath="/crm" mode={mode} />
      </div>

      {mode === 'data' ? (
        <>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="max-w-md">
              <Input
                placeholder="Search customers (name, email, company…)"
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {ability.can('view', 'Company') ? (
                <Button asChild variant="outline">
                  <Link href="/crm/companies">Companies</Link>
                </Button>
              ) : null}
              {ability.can('view', 'Contact') ? (
                <Button asChild variant="outline">
                  <Link href="/crm/contacts">Contacts</Link>
                </Button>
              ) : null}
              <Button
                onClick={handleNewCustomer}
                variant="accent"
                disabled={!ability.can('create', 'Customer')}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                New Customer
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-background px-3 py-2 text-sm text-muted-foreground">
            <div>
              Page <span className="font-medium text-foreground">{meta?.page ?? page}</span>
              {meta?.total != null ? (
                <> • Total <span className="font-medium text-foreground">{meta.total}</span></>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={loading || (meta?.page ?? page) <= 1}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading || meta?.hasNext === false}
              >
                Next
              </Button>
            </div>
          </div>

          <CustomerTable
            customers={customers}
            loading={loading}
            error={error}
            onEdit={handleEditCustomer}
            onDelete={(c) => handleDeleteCustomer(c.id)}
          />

          <CustomerDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            customer={selectedCustomer}
            onFormSubmit={() => {
              setDialogOpen(false);
              setSelectedCustomer(null);
            }}
            onCreate={createCustomer}
            onUpdate={updateCustomer}
          />
        </>
      ) : (
        <>
          <SalesFiltersBar owners={owners} clients={clients} value={filters} onChange={setFilters} />
          <SalesCrmView opportunities={filteredOpps} alerts={filteredAlerts} />
        </>
      )}
    </div>
  );
}
