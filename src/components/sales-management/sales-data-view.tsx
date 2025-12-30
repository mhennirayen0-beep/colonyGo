'use client';

import Link from 'next/link';
import React, { useMemo, useRef, useState } from 'react';
import { Building2, Clock3, DollarSign, ShieldAlert, UserRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AIProvenanceIcon } from '@/components/ai/ai-provenance-icon';
import { ExportActions } from './sales-export-actions';
import { Button } from '@/components/ui/button';
import type { Opportunity, SalesActionRow, SalesAlertRow, SalesNewsRow, RagStatus } from '@/lib/types';
import { formatCurrency, getOpportunityCurrency, phaseVariant, statusClass, ragBadge } from './sales-utils';
import { useAbility } from '@/lib/ability';

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

function SectionControls({
  shown,
  total,
  initial,
  step,
  onMore,
  onAll,
  onReset,
}: {
  shown: number;
  total: number;
  initial: number;
  step: number;
  onMore: () => void;
  onAll: () => void;
  onReset: () => void;
}) {
  if (total <= initial) return null;

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
      <div className="text-xs text-muted-foreground">
        Showing <span className="font-medium text-foreground">{shown}</span> of{' '}
        <span className="font-medium text-foreground">{total}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {shown < total && (
          <>
            <Button variant="secondary" size="sm" onClick={onMore}>
              More Entries (+{Math.min(step, total - shown)})
            </Button>
            <Button variant="outline" size="sm" onClick={onAll}>
              Show all
            </Button>
          </>
        )}
        {shown > initial && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            Collapse
          </Button>
        )}
      </div>
    </div>
  );
}

function MoneyGrid({ items }: { items: Array<{ label: string; value: React.ReactNode }> }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="rounded-xl border bg-background p-3">
          <div className="text-xs text-muted-foreground">{it.label}</div>
          <div className="mt-1 font-semibold">{it.value}</div>
        </div>
      ))}
    </div>
  );
}

export function SalesDataView({ opportunities, actions, alerts, news, getRagForActionTitle, onEditOpportunity }: Props) {
  const ability = useAbility();
  const oppRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const alertsRef = useRef<HTMLDivElement>(null);
  const newsRef = useRef<HTMLDivElement>(null);

  // "More Entries" limits per section (Data mode hotfix)
  const OPP_INITIAL = 8;
  const ACT_INITIAL = 8;
  const ALERT_INITIAL = 8;
  const NEWS_INITIAL = 12;
  const STEP = 10;

  const [oppLimit, setOppLimit] = useState(OPP_INITIAL);
  const [actLimit, setActLimit] = useState(ACT_INITIAL);
  const [alertLimit, setAlertLimit] = useState(ALERT_INITIAL);
  const [newsLimit, setNewsLimit] = useState(NEWS_INITIAL);

  // Row expand (to avoid horizontal scroll while still exposing all fields)
  const [expandedOpp, setExpandedOpp] = useState<Set<string>>(() => new Set());
  const [expandedActions, setExpandedActions] = useState<Set<string>>(() => new Set());
  const [expandedAlerts, setExpandedAlerts] = useState<Set<string>>(() => new Set());

  const toggleSet = (setter: React.Dispatch<React.SetStateAction<Set<string>>>, key: string) => {
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const oppRows = useMemo(
    () =>
      opportunities.map((o) => ({
        id: o.id,
        currency: getOpportunityCurrency(o),
        opportunityname: o.opportunityname,
        customername: o.customername,
        companyid: o.companyid ?? '',
        companyname: o.companyname ?? '',
        contactid: o.contactid ?? '',
        contactname: o.contactname ?? '',
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

  const canViewCompany = ability.can('view', 'Company');
  const canViewContact = ability.can('view', 'Contact');
  const showCrmCol = canViewCompany || canViewContact;

  const shownOpps = useMemo(() => opportunities.slice(0, oppLimit), [opportunities, oppLimit]);
  const shownActions = useMemo(() => actions.slice(0, actLimit), [actions, actLimit]);
  const shownAlerts = useMemo(() => alerts.slice(0, alertLimit), [alerts, alertLimit]);

  const sortedNews = useMemo(
    () => news.slice().sort((a, b) => b.timestampISO.localeCompare(a.timestampISO)),
    [news]
  );
  const shownNews = useMemo(() => sortedNews.slice(0, newsLimit), [sortedNews, newsLimit]);

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
              {shownOpps.map((o) => {
                const open = expandedOpp.has(o.id);
                return (
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
                      {canViewCompany && (o.companyname || o.companyid) ? (
                        <MetaLine
                          icon={Building2}
                          label="Company"
                          value={o.companyname || o.companyid}
                        />
                      ) : null}
                      {canViewContact && (o.contactname || o.contactid) ? (
                        <MetaLine
                          icon={UserRound}
                          label="Contact"
                          value={o.contactname || o.contactid}
                        />
                      ) : null}
                      <MetaLine icon={UserRound} label="Owner" value={o.opportunityowner} />
                      <MetaLine icon={DollarSign} label="Forecast" value={formatCurrency(o.value_forecast, getOpportunityCurrency(o))} />
                    </div>

                    {open && (
                      <div className="mt-4 space-y-3">
                        {(canViewCompany || canViewContact) && (o.companyid || o.companyname || o.contactid || o.contactname) ? (
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-background p-3 text-sm">
                            <div className="min-w-0">
                              {canViewCompany && (o.companyname || o.companyid) ? (
                                <div className="truncate"><span className="text-muted-foreground">Company:</span> <span className="font-medium">{o.companyname || o.companyid}</span></div>
                              ) : null}
                              {canViewContact && (o.contactname || o.contactid) ? (
                                <div className="truncate"><span className="text-muted-foreground">Contact:</span> <span className="font-medium">{o.contactname || o.contactid}</span></div>
                              ) : null}
                            </div>
                            {canViewContact && o.companyid ? (
                              <Button asChild size="sm" variant="secondary">
                                <Link href={`/crm/contacts?companyId=${encodeURIComponent(o.companyid)}`}>Company contacts</Link>
                              </Button>
                            ) : null}
                          </div>
                        ) : null}

                        <MoneyGrid
                          items={[
                            { label: 'Final', value: formatCurrency(o.value_final, getOpportunityCurrency(o)) },
                            { label: 'Discount', value: formatCurrency(o.value_discount, getOpportunityCurrency(o)) },
                            { label: 'Hardware', value: formatCurrency(o.hardware_price, getOpportunityCurrency(o)) },
                            { label: 'Software', value: formatCurrency(o.software_price, getOpportunityCurrency(o)) },
                            { label: 'Services', value: formatCurrency(o.service_price, getOpportunityCurrency(o)) },
                            { label: 'Budget', value: formatCurrency(o.value_budget, getOpportunityCurrency(o)) },
                            { label: 'Customer value', value: formatCurrency(o.value_customer, getOpportunityCurrency(o)) },
                            { label: 'Bonus', value: formatCurrency(o.value_bonus, getOpportunityCurrency(o)) },
                          ]}
                        />
                      </div>
                    )}

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
                      <Button variant="ghost" className="h-9" onClick={() => toggleSet(setExpandedOpp, o.id)}>
                        {open ? 'Hide' : 'Details'}
                      </Button>
                    </div>
                  </div>
                );
              })}

              <div className="px-1 pb-2">
                <SectionControls
                  shown={shownOpps.length}
                  total={opportunities.length}
                  initial={OPP_INITIAL}
                  step={STEP}
                  onMore={() => setOppLimit((x) => Math.min(opportunities.length, x + STEP))}
                  onAll={() => setOppLimit(opportunities.length)}
                  onReset={() => {
                    setOppLimit(OPP_INITIAL);
                    setExpandedOpp(new Set());
                  }}
                />
              </div>
            </div>

            {/* Desktop table (no horizontal scroll; extra fields available via row expand) */}
            <div className="hidden rounded-2xl md:block">
              <Table className="w-full table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[130px]">ID</TableHead>
                    <TableHead>Opportunity</TableHead>
                    <TableHead className="w-[200px]">Client</TableHead>
                    {showCrmCol ? <TableHead className="w-[220px]">CRM</TableHead> : null}
                    <TableHead className="w-[170px]">Owner</TableHead>
                    <TableHead className="w-[140px]">Phase</TableHead>
                    <TableHead className="w-[140px]">Status</TableHead>
                    <TableHead className="w-[140px] text-right">Forecast</TableHead>
                    <TableHead className="w-[220px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {shownOpps.map((o) => {
                    const open = expandedOpp.has(o.id);
                    return (
                      <React.Fragment key={o.id}>
                        <TableRow>
                          <TableCell className="font-mono text-xs align-top whitespace-normal break-words">
                            {o.id}
                          </TableCell>
                          <TableCell className="align-top whitespace-normal break-words">
                            <Link
                              href={`/opportunities/${encodeURIComponent(o.id)}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {o.opportunityname}
                            </Link>
                          </TableCell>
                          <TableCell className="align-top whitespace-normal break-words">{o.customername}</TableCell>
                          {showCrmCol ? (
                            <TableCell className="align-top whitespace-normal break-words">
                              <div className="space-y-1 text-xs">
                                {canViewCompany ? (
                                  <div className="truncate">
                                    <span className="text-muted-foreground">Co:</span>{' '}
                                    <span className="font-medium">{o.companyname || o.companyid || '-'}</span>
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground">Company: —</div>
                                )}
                                {canViewContact ? (
                                  <div className="truncate">
                                    <span className="text-muted-foreground">Ct:</span>{' '}
                                    <span className="font-medium">{o.contactname || o.contactid || '-'}</span>
                                  </div>
                                ) : (
                                  <div className="text-muted-foreground">Contact: —</div>
                                )}
                              </div>
                            </TableCell>
                          ) : null}
                          <TableCell className="align-top whitespace-normal break-words">{o.opportunityowner}</TableCell>
                          <TableCell className="align-top">
                            <Badge variant={phaseVariant[o.opportunityphase]}>{o.opportunityphase}</Badge>
                          </TableCell>
                          <TableCell className="align-top">
                            <Badge className={statusClass[o.opportunitystatut]}>{o.opportunitystatut}</Badge>
                          </TableCell>
                          <TableCell className="align-top text-right">{formatCurrency(o.value_forecast, getOpportunityCurrency(o))}</TableCell>
                          <TableCell className="align-top whitespace-nowrap text-right">
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
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleSet(setExpandedOpp, o.id)}
                              >
                                {open ? 'Hide' : 'Details'}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {open && (
                          <TableRow className="bg-muted/20">
                            <TableCell colSpan={showCrmCol ? 9 : 8} className="p-4">
                              {(canViewCompany || canViewContact) && (o.companyid || o.companyname || o.contactid || o.contactname) ? (
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-background p-3 text-sm">
                                  <div className="min-w-0">
                                    {canViewCompany && (o.companyname || o.companyid) ? (
                                      <div className="truncate"><span className="text-muted-foreground">Company:</span> <span className="font-medium">{o.companyname || o.companyid}</span></div>
                                    ) : null}
                                    {canViewContact && (o.contactname || o.contactid) ? (
                                      <div className="truncate"><span className="text-muted-foreground">Contact:</span> <span className="font-medium">{o.contactname || o.contactid}</span></div>
                                    ) : null}
                                  </div>
                                  {canViewContact && o.companyid ? (
                                    <Button asChild size="sm" variant="secondary">
                                      <Link href={`/crm/contacts?companyId=${encodeURIComponent(o.companyid)}`}>Company contacts</Link>
                                    </Button>
                                  ) : null}
                                </div>
                              ) : null}

                              <MoneyGrid
                                items={[
                                    { label: 'Final', value: formatCurrency(o.value_final, getOpportunityCurrency(o)) },
                                    { label: 'Discount', value: formatCurrency(o.value_discount, getOpportunityCurrency(o)) },
                                    { label: 'Hardware', value: formatCurrency(o.hardware_price, getOpportunityCurrency(o)) },
                                    { label: 'Software', value: formatCurrency(o.software_price, getOpportunityCurrency(o)) },
                                    { label: 'Services', value: formatCurrency(o.service_price, getOpportunityCurrency(o)) },
                                    { label: 'Budget', value: formatCurrency(o.value_budget, getOpportunityCurrency(o)) },
                                    { label: 'Customer value', value: formatCurrency(o.value_customer, getOpportunityCurrency(o)) },
                                    { label: 'Bonus', value: formatCurrency(o.value_bonus, getOpportunityCurrency(o)) },
                                ]}
                              />
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="px-4 pb-4">
                <SectionControls
                  shown={shownOpps.length}
                  total={opportunities.length}
                  initial={OPP_INITIAL}
                  step={STEP}
                  onMore={() => setOppLimit((x) => Math.min(opportunities.length, x + STEP))}
                  onAll={() => setOppLimit(opportunities.length)}
                  onReset={() => {
                    setOppLimit(OPP_INITIAL);
                    setExpandedOpp(new Set());
                  }}
                />
              </div>
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
              {shownActions.map((a, idx) => {
                const key = `${a.opportunityid}-${idx}`;
                const open = expandedActions.has(key);
                const rag = getRagForActionTitle(a.title);
                const rb = ragBadge(rag);
                return (
                  <div key={key} className="rounded-2xl border bg-card p-4 shadow-sm">
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
                      {open && (
                        <div className="flex items-start gap-2 text-sm">
                          <AIProvenanceIcon className="mt-0.5" />
                          <div className="text-muted-foreground">Action:</div>
                          <div className="font-medium text-foreground">{a.currentaction}</div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => toggleSet(setExpandedActions, key)}>
                        {open ? 'Hide' : 'Details'}
                      </Button>
                    </div>
                  </div>
                );
              })}

              <div className="px-1 pb-2">
                <SectionControls
                  shown={shownActions.length}
                  total={actions.length}
                  initial={ACT_INITIAL}
                  step={STEP}
                  onMore={() => setActLimit((x) => Math.min(actions.length, x + STEP))}
                  onAll={() => setActLimit(actions.length)}
                  onReset={() => {
                    setActLimit(ACT_INITIAL);
                    setExpandedActions(new Set());
                  }}
                />
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table className="w-full table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Opportunity ID</TableHead>
                    <TableHead>Opportunity</TableHead>
                    <TableHead className="w-[220px]">Client</TableHead>
                    <TableHead className="w-[180px]">Owner</TableHead>
                    <TableHead className="w-[120px]">RAG</TableHead>
                    <TableHead className="w-[160px] text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shownActions.map((a, idx) => {
                    const key = `${a.opportunityid}-${idx}`;
                    const open = expandedActions.has(key);
                    const rag = getRagForActionTitle(a.title);
                    const rb = ragBadge(rag);
                    return (
                      <React.Fragment key={key}>
                        <TableRow>
                          <TableCell className="font-mono text-xs align-top whitespace-normal break-words">
                            {a.opportunityid}
                          </TableCell>
                          <TableCell className="align-top whitespace-normal break-words font-medium">
                            {a.title}
                          </TableCell>
                          <TableCell className="align-top whitespace-normal break-words">{a.clientname}</TableCell>
                          <TableCell className="align-top whitespace-normal break-words">{a.salesowner}</TableCell>
                          <TableCell className="align-top">
                            <Badge className={rb.cls}>{rb.label}</Badge>
                          </TableCell>
                          <TableCell className="align-top text-right">
                            <Button size="sm" variant="ghost" onClick={() => toggleSet(setExpandedActions, key)}>
                              {open ? 'Hide' : 'Details'}
                            </Button>
                          </TableCell>
                        </TableRow>

                        {open && (
                          <TableRow className="bg-muted/20">
                            <TableCell colSpan={6} className="p-4">
                              <div className="flex items-start gap-2 text-sm">
                                <AIProvenanceIcon className="mt-0.5" />
                                <div className="space-y-1">
                                  <div className="text-xs font-semibold text-muted-foreground">Current action</div>
                                  <div className="whitespace-normal break-words">{a.currentaction}</div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="px-4 pb-4">
                <SectionControls
                  shown={shownActions.length}
                  total={actions.length}
                  initial={ACT_INITIAL}
                  step={STEP}
                  onMore={() => setActLimit((x) => Math.min(actions.length, x + STEP))}
                  onAll={() => setActLimit(actions.length)}
                  onReset={() => {
                    setActLimit(ACT_INITIAL);
                    setExpandedActions(new Set());
                  }}
                />
              </div>
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
              {shownAlerts.map((a, idx) => {
                const key = `${a.opportunityname}-${idx}`;
                const open = expandedAlerts.has(key);
                const rag: RagStatus = a.delay_days >= 30 ? 'red' : a.delay_days >= 15 ? 'orange' : 'green';
                const rb = ragBadge(rag);
                return (
                  <div key={key} className="rounded-2xl border bg-card p-4 shadow-sm">
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
                      <MetaLine icon={Clock3} label="Delay" value={`${a.delay_days} days`} />
                      {open && <MetaLine icon={ShieldAlert} label="Action" value={a.currentaction} />}
                    </div>
                    <div className="mt-4 flex justify-end">
                      <Button variant="ghost" size="sm" onClick={() => toggleSet(setExpandedAlerts, key)}>
                        {open ? 'Hide' : 'Details'}
                      </Button>
                    </div>
                  </div>
                );
              })}

              <div className="px-1 pb-2">
                <SectionControls
                  shown={shownAlerts.length}
                  total={alerts.length}
                  initial={ALERT_INITIAL}
                  step={STEP}
                  onMore={() => setAlertLimit((x) => Math.min(alerts.length, x + STEP))}
                  onAll={() => setAlertLimit(alerts.length)}
                  onReset={() => {
                    setAlertLimit(ALERT_INITIAL);
                    setExpandedAlerts(new Set());
                  }}
                />
              </div>
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <Table className="w-full table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead>Opportunity</TableHead>
                    <TableHead className="w-[200px]">Owner</TableHead>
                    <TableHead className="w-[130px] text-right">Delay</TableHead>
                    <TableHead className="w-[140px]">Criticity</TableHead>
                    <TableHead className="w-[140px] text-right">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {shownAlerts.map((a, idx) => {
                    const key = `${a.opportunityname}-${idx}`;
                    const open = expandedAlerts.has(key);
                    const rag: RagStatus = a.delay_days >= 30 ? 'red' : a.delay_days >= 15 ? 'orange' : 'green';
                    const rb = ragBadge(rag);
                    return (
                      <React.Fragment key={key}>
                        <TableRow>
                          <TableCell className="font-medium align-top whitespace-normal break-words">
                            {a.opportunityname}
                          </TableCell>
                          <TableCell className="align-top whitespace-normal break-words">{a.salesowner}</TableCell>
                          <TableCell className="align-top text-right">{a.delay_days} days</TableCell>
                          <TableCell className="align-top">
                            <Badge className={rb.cls}>
                              {rag === 'red' ? 'Urgent' : rag === 'orange' ? 'Warning' : 'Info'}
                            </Badge>
                          </TableCell>
                          <TableCell className="align-top text-right">
                            <Button size="sm" variant="ghost" onClick={() => toggleSet(setExpandedAlerts, key)}>
                              {open ? 'Hide' : 'Details'}
                            </Button>
                          </TableCell>
                        </TableRow>

                        {open && (
                          <TableRow className="bg-muted/20">
                            <TableCell colSpan={5} className="p-4">
                              <div className="flex items-start gap-2 text-sm">
                                <AIProvenanceIcon className="mt-0.5" />
                                <div className="space-y-1">
                                  <div className="text-xs font-semibold text-muted-foreground">Current action</div>
                                  <div className="whitespace-normal break-words">{a.currentaction}</div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="px-4 pb-4">
                <SectionControls
                  shown={shownAlerts.length}
                  total={alerts.length}
                  initial={ALERT_INITIAL}
                  step={STEP}
                  onMore={() => setAlertLimit((x) => Math.min(alerts.length, x + STEP))}
                  onAll={() => setAlertLimit(alerts.length)}
                  onReset={() => {
                    setAlertLimit(ALERT_INITIAL);
                    setExpandedAlerts(new Set());
                  }}
                />
              </div>
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
            {shownNews.map((n, idx) => (
              <div
                key={`${n.opportunityid}-${idx}`}
                className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="text-sm font-semibold">
                    {n.clientname} · <span className="font-mono text-xs text-muted-foreground">{n.opportunityid}</span>
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

          <SectionControls
            shown={shownNews.length}
            total={sortedNews.length}
            initial={NEWS_INITIAL}
            step={STEP}
            onMore={() => setNewsLimit((x) => Math.min(sortedNews.length, x + STEP))}
            onAll={() => setNewsLimit(sortedNews.length)}
            onReset={() => setNewsLimit(NEWS_INITIAL)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
