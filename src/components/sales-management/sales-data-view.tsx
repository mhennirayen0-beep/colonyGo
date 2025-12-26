'use client';

import Link from 'next/link';
import { useMemo, useRef } from 'react';
import { Building2, Clock3, DollarSign, ShieldAlert, UserRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AIProvenanceIcon } from '@/components/ai/ai-provenance-icon';
import { ExportActions } from './sales-export-actions';
import { Button } from '@/components/ui/button';
import type { Opportunity, SalesActionRow, SalesAlertRow, SalesNewsRow, RagStatus } from '@/lib/types';
import { formatCurrency, phaseVariant, statusClass, ragBadge } from './sales-utils';

type Props = {
  opportunities: Opportunity[];
  actions: SalesActionRow[];
  alerts: SalesAlertRow[];
  news: SalesNewsRow[];
  getRagForActionTitle: (title: string) => RagStatus;
  onEditOpportunity?: (opportunity: Opportunity) => void;
};

function MetaLine({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="text-muted-foreground">{label}:</div>
      <div className="font-medium text-foreground">{value}</div>
    </div>
  );
}

export function SalesDataView({ opportunities, actions, alerts, news, getRagForActionTitle, onEditOpportunity }: Props) {
  const oppRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);
  const newsRef = useRef<HTMLDivElement>(null);

  const oppRows = useMemo(
    () =>
      opportunities.map((o) => ({
        id: o.id,
        opportunityname: o.opportunityname,
        customername: o.customername,
        opportunityowner: o.opportunityowner,
        opportunityphase: o.opportunityphase,
        opportunitystatut: o.opportunitystatut,
        hardware_price: o.hardware_price,
        software_price: o.software_price,
        service_price: o.service_price,
        value_forecast: o.value_forecast,
        value_final: o.value_final,
        value_discount: o.value_discount,
        value_budget: o.value_budget,
        value_customer: o.value_customer,
        value_bonus: o.value_bonus,
      })),
    [opportunities]
  );

  return (
    <div className="space-y-6">
      {/* 1) Opportunities */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="font-headline">Opportunities</CardTitle>
              <CardDescription>Raw data view (exportable)</CardDescription>
            </div>
            <ExportActions rows={oppRows} filenameBase="opportunities" element={oppRef.current} />
          </div>
        </CardHeader>
        <CardContent>
          <div ref={oppRef} className="rounded-2xl border bg-background">
            {/* Mobile cards */}
            <div className="space-y-3 p-3 md:hidden">
              {opportunities.map((o) => (
                <div key={o.id} className="rounded-2xl border bg-card p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/opportunities/${encodeURIComponent(o.id)}`}
                        className="truncate text-sm font-semibold text-primary hover:underline"
                      >
                        {o.opportunityname}
                      </Link>
                      <div className="mt-0.5 font-mono text-xs text-muted-foreground">{o.id}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={phaseVariant[o.opportunityphase]}>{o.opportunityphase}</Badge>
                      <Badge className={statusClass[o.opportunitystatut]}>{o.opportunitystatut}</Badge>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    <MetaLine icon={Building2} label="Client" value={o.customername} />
                    <MetaLine icon={UserRound} label="Owner" value={o.opportunityowner} />
                    <MetaLine icon={DollarSign} label="Forecast" value={formatCurrency(o.value_forecast)} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button asChild variant="secondary" className="h-9">
                      <Link href={`/opportunities/${encodeURIComponent(o.id)}`}>View details</Link>
                    </Button>
                    <Button
                      variant="outline"
                      className="h-9"
                      onClick={() => onEditOpportunity?.(o)}
                      disabled={!onEditOpportunity}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-2xl md:block">
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
                    <TableHead className="text-right">Discount</TableHead>
                    <TableHead className="text-right">Hardware</TableHead>
                    <TableHead className="text-right">Software</TableHead>
                    <TableHead className="text-right">Services</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {opportunities.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.id}</TableCell>
                      <TableCell className="font-medium">
                        <Link
                          href={`/opportunities/${encodeURIComponent(o.id)}`}
                          className="text-primary hover:underline"
                        >
                          {o.opportunityname}
                        </Link>
                      </TableCell>
                      <TableCell>{o.customername}</TableCell>
                      <TableCell>{o.opportunityowner}</TableCell>
                      <TableCell>
                        <Badge variant={phaseVariant[o.opportunityphase]}>{o.opportunityphase}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={statusClass[o.opportunitystatut]}>{o.opportunitystatut}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(o.value_forecast)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(o.value_final)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(o.value_discount)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(o.hardware_price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(o.software_price)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(o.service_price)}</TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="secondary">
                            <Link href={`/opportunities/${encodeURIComponent(o.id)}`}>View</Link>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onEditOpportunity?.(o)}
                            disabled={!onEditOpportunity}
                          >
                            Edit
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2) Actions à suivre */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="font-headline">Actions à suivre</CardTitle>
              <CardDescription>Linked from Ticketing Management (with RAG status)</CardDescription>
            </div>
            <ExportActions rows={actions as any[]} filenameBase="actions" element={actionsRef.current} />
          </div>
        </CardHeader>
        <CardContent>
          <div ref={actionsRef} className="rounded-2xl border bg-background">
            {/* Mobile cards */}
            <div className="space-y-3 p-3 md:hidden">
              {actions.map((a, idx) => {
                const rag = getRagForActionTitle(a.title);
                const rb = ragBadge(rag);
                return (
                  <div key={`${a.opportunityid}-${idx}`} className="rounded-2xl border bg-card p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{a.title}</div>
                        <div className="mt-0.5 font-mono text-xs text-muted-foreground">{a.opportunityid}</div>
                      </div>
                      <Badge className={rb.cls}>{rb.label}</Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      <MetaLine icon={Building2} label="Client" value={a.clientname} />
                      <MetaLine icon={UserRound} label="Owner" value={a.salesowner} />
                      <div className="flex items-start gap-2 text-sm">
                        <AIProvenanceIcon className="mt-0.5" />
                        <div className="text-muted-foreground">Action:</div>
                        <div className="font-medium text-foreground">{a.currentaction}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-2xl md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Opportunity ID</TableHead>
                    <TableHead>Opportunity</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Current action</TableHead>
                    <TableHead>RAG</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {actions.map((a, idx) => {
                    const rag = getRagForActionTitle(a.title);
                    const rb = ragBadge(rag);
                    return (
                      <TableRow key={`${a.opportunityid}-${idx}`}>
                        <TableCell className="font-mono text-xs">{a.opportunityid}</TableCell>
                        <TableCell className="font-medium">{a.title}</TableCell>
                        <TableCell>{a.clientname}</TableCell>
                        <TableCell>{a.salesowner}</TableCell>
                        <TableCell className="max-w-[420px]">
                          <div className="flex items-start gap-2">
                            <AIProvenanceIcon className="mt-0.5" />
                            <span>{a.currentaction}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={rb.cls}>{rb.label}</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3) Alerts */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="font-headline">Alertes</CardTitle>
              <CardDescription>System + IA alerts (sortable/exportable)</CardDescription>
            </div>
            <ExportActions rows={alerts as any[]} filenameBase="alerts" element={alertsRef.current} />
          </div>
        </CardHeader>
        <CardContent>
          <div ref={alertsRef} className="rounded-2xl border bg-background">
            {/* Mobile cards */}
            <div className="space-y-3 p-3 md:hidden">
              {alerts.map((a, idx) => {
                const rag: RagStatus = a.delay_days >= 30 ? 'red' : a.delay_days >= 15 ? 'orange' : 'green';
                const rb = ragBadge(rag);
                return (
                  <div key={`${a.opportunityname}-${idx}`} className="rounded-2xl border bg-card p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{a.opportunityname}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">by {a.salesowner}</div>
                      </div>
                      <Badge className={rb.cls}>
                        {rag === 'red' ? 'Urgent' : rag === 'orange' ? 'Warning' : 'Info'}
                      </Badge>
                    </div>
                    <div className="mt-3 space-y-2">
                      <MetaLine icon={ShieldAlert} label="Action" value={a.currentaction} />
                      <MetaLine icon={Clock3} label="Delay" value={`${a.delay_days} days`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop table */}
            <div className="hidden overflow-x-auto rounded-2xl md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Opportunity</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Current action</TableHead>
                    <TableHead className="text-right">Delay (days)</TableHead>
                    <TableHead>Criticity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {alerts.map((a, idx) => {
                    const rag: RagStatus = a.delay_days >= 30 ? 'red' : a.delay_days >= 15 ? 'orange' : 'green';
                    const rb = ragBadge(rag);
                    return (
                      <TableRow key={`${a.opportunityname}-${idx}`}>
                        <TableCell className="font-medium">{a.opportunityname}</TableCell>
                        <TableCell>{a.salesowner}</TableCell>
                        <TableCell>{a.currentaction}</TableCell>
                        <TableCell className="text-right">{a.delay_days}</TableCell>
                        <TableCell>
                          <Badge className={rb.cls}>
                            {rag === 'red' ? 'Urgent' : rag === 'orange' ? 'Warning' : 'Info'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4) News Feed */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle className="font-headline">News Feed</CardTitle>
              <CardDescription>Subscription-based events summary</CardDescription>
            </div>
            <ExportActions rows={news as any[]} filenameBase="news_feed" element={newsRef.current} />
          </div>
        </CardHeader>
        <CardContent>
          <div ref={newsRef} className="divide-y rounded-2xl border bg-background">
            {news
              .slice()
              .sort((a, b) => b.timestampISO.localeCompare(a.timestampISO))
              .map((n, idx) => (
                <div
                  key={`${n.opportunityid}-${idx}`}
                  className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="text-sm font-semibold">
                      {n.clientname} ·{' '}
                      <span className="font-mono text-xs text-muted-foreground">{n.opportunityid}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">{n.actioncompleted}</div>
                    <div className="text-xs text-muted-foreground">by {n.salesowner}</div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(n.timestampISO).toLocaleDateString()}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
