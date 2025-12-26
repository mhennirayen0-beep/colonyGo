'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { opportunities, salesActions, salesAlertes, salesNewsFeed, users } from '@/lib/data';
import type { Opportunity, SalesAction, SalesAlertRow, SalesNewsRow } from '@/lib/types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const phaseVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  Prospection: 'outline',
  Discovery: 'secondary',
  Evaluation: 'default',
  Deal: 'outline',
};

const statusColor: Record<string, string> = {
  Forecast: 'bg-status-forecast text-white',
  Start: 'bg-status-start text-white',
  Stop: 'bg-status-stop text-white',
  Cancelled: 'bg-status-cancelled text-white',
};

function ragFromDelay(delayDays: number) {
  // Simple rule for now (Excel provides delay_days)
  if (delayDays <= 2) return { label: 'On track', dot: 'bg-status-start' };
  if (delayDays <= 7) return { label: 'At risk', dot: 'bg-orange-500' };
  return { label: 'Overdue', dot: 'bg-status-stop' };
}

function OwnerCell({ name }: { name: string }) {
  const u = users.find((x) => x.displayName === name);
  return (
    <div className="flex items-center gap-2">
      <Avatar className="h-6 w-6">
        <AvatarImage src={u?.photoURL} alt={name} />
        <AvatarFallback>{u?.initials ?? name.split(' ').map((p) => p[0]).join('')}</AvatarFallback>
      </Avatar>
      <span className="text-sm">{name}</span>
    </div>
  );
}

export function SalesDataView({ onNewOpportunity }: { onNewOpportunity?: () => void } = {}) {
  const [q, setQ] = useState('');

  const filteredOpps = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return opportunities;
    return opportunities.filter((o) =>
      [o.id, o.opportunityname, o.customername, o.opportunityowner, o.opportunityphase, o.opportunitystatut]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(qq))
    );
  }, [q]);

  const filteredActions = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return salesActions;
    return salesActions.filter((a) =>
      [a.opportunityid, a.title, a.clientname, a.currentaction, a.salesowner]
        .some((v) => String(v).toLowerCase().includes(qq))
    );
  }, [q]);

  const filteredAlerts = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return salesAlertes;
    return salesAlertes.filter((a) =>
      [a.opportunityname, a.currentaction, a.salesowner, a.delay_days]
        .some((v) => String(v).toLowerCase().includes(qq))
    );
  }, [q]);

  const filteredNews = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return salesNewsFeed;
    return salesNewsFeed.filter((n) =>
      [n.opportunityid, n.actioncompleted, n.clientname, n.salesowner]
        .some((v) => String(v).toLowerCase().includes(qq))
    );
  }, [q]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold text-primary">Sales Management</h1>
          <p className="text-sm text-muted-foreground">
            Data view (tables). Search applies across Opportunities, Actions, Alerts, and News Feed.
          </p>
        </div>
        <Button variant="accent" className="w-full sm:w-auto" onClick={onNewOpportunity}>
          <PlusCircle className="h-4 w-4" />
          New Opportunity
        </Button>
      </div>

      {/* Global Search */}
      <div className="flex gap-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by opportunity, client, owner, status..."
          className="max-w-xl"
        />
      </div>

      {/* 1) Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Opportunities</CardTitle>
          <CardDescription>Raw table extracted from the Excel dummy data.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Opportunity</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Phase</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Forecast</TableHead>
                <TableHead className="text-right">Final</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOpps.map((o: Opportunity) => (
                <TableRow key={o.id}>
                  <TableCell className="font-mono text-xs">
                    <Link className="text-primary hover:underline" href={`/opportunities/${o.id}`}>
                      {o.opportunityid}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">{o.opportunityname}</TableCell>
                  <TableCell>{o.customername}</TableCell>
                  <TableCell>
                    <OwnerCell name={o.opportunityowner} />
                  </TableCell>
                  <TableCell>
                    <Badge variant={phaseVariant[o.opportunityphase] ?? 'outline'}>{o.opportunityphase}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={statusColor[o.opportunitystatut] ?? 'bg-secondary'}>
                      {o.opportunitystatut}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(o.value_forecast)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(o.value_final)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 2) Actions à suivre */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Actions à suivre</CardTitle>
          <CardDescription>
            Action list (Ticketing Management). RAG indicator computed from delay/urgency rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opportunity ID</TableHead>
                <TableHead>Opportunity</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Sales Owner</TableHead>
                <TableHead>Current action</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActions.map((a: SalesAction, idx: number) => (
                <TableRow key={`${a.opportunityid}-${idx}`}>
                  <TableCell className="font-mono text-xs">{a.opportunityid}</TableCell>
                  <TableCell className="font-medium">{a.title}</TableCell>
                  <TableCell>{a.clientname}</TableCell>
                  <TableCell><OwnerCell name={a.salesowner} /></TableCell>
                  <TableCell className="max-w-[420px] truncate">{a.currentaction}</TableCell>
                  <TableCell>
                    {/* no delay_days in action list; we show neutral */}
                    <span className="inline-flex items-center gap-2 text-sm">
                      <span className="h-2 w-2 rounded-full bg-status-forecast" />
                      In progress
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 3) Alertes */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Alertes</CardTitle>
          <CardDescription>Alerts (system + IA). Delay-based severity from Excel field delay_days.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opportunity</TableHead>
                <TableHead>Sales Owner</TableHead>
                <TableHead>Current action</TableHead>
                <TableHead className="text-right">Delay (days)</TableHead>
                <TableHead>Severity</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAlerts.map((a: SalesAlertRow, idx: number) => {
                const rag = ragFromDelay(a.delay_days);
                return (
                  <TableRow key={`${a.opportunityname}-${idx}`}>
                    <TableCell className="font-medium">{a.opportunityname}</TableCell>
                    <TableCell><OwnerCell name={a.salesowner} /></TableCell>
                    <TableCell className="max-w-[520px] truncate">{a.currentaction}</TableCell>
                    <TableCell className="text-right font-mono text-xs">{a.delay_days}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-2 text-sm">
                        <span className={`h-2 w-2 rounded-full ${rag.dot}`} />
                        {rag.label}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 4) News Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">News Feed</CardTitle>
          <CardDescription>Subscription-based updates (from Excel dummy feed).</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Opportunity ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Sales Owner</TableHead>
                <TableHead>Event</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredNews.map((n: SalesNewsRow, idx: number) => (
                <TableRow key={`${n.opportunityid}-${idx}`}>
                  <TableCell className="font-mono text-xs">{n.opportunityid}</TableCell>
                  <TableCell>{n.clientname}</TableCell>
                  <TableCell><OwnerCell name={n.salesowner} /></TableCell>
                  <TableCell className="max-w-[600px] truncate">{n.actioncompleted}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
