'use client';

import Link from "next/link";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Opportunity } from "@/lib/types";
import type { SalesActionRow, SalesAlertRow, SalesNewsRow } from "@/lib/data";

function money(n: number) {
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(Number(n ?? 0));
}

export function SalesDataView({
  opportunities,
  actions,
  alerts,
  news,
}: {
  opportunities: Opportunity[];
  actions: SalesActionRow[];
  alerts: SalesAlertRow[];
  news: SalesNewsRow[];
}) {
  const oppById = useMemo(() => new Map(opportunities.map((o) => [o.id, o])), [opportunities]);

  return (
    <div className="space-y-4">
      {/* 1) Opportunities */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">Opportunities</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile cards */}
          <div className="space-y-2 md:hidden">
            {opportunities.slice(0, 20).map((o) => (
              <Link key={o.id} href={`/opportunities/${o.id}`} className="block rounded-2xl border bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{o.opportunityname}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {o.customername} · {o.opportunityowner}
                    </div>
                  </div>
                  <Badge variant="secondary">{o.opportunityphase}</Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Status: {o.opportunitystatut}</span>
                  <span className="tabular-nums">Forecast: {money(o.value_forecast)}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block">
            <ScrollArea className="w-full">
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
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {opportunities.map((o) => (
                    <TableRow key={o.id}>
                      <TableCell className="font-mono text-xs">{o.id}</TableCell>
                      <TableCell className="max-w-[380px]">
                        <Link href={`/opportunities/${o.id}`} className="font-medium hover:underline">
                          {o.opportunityname}
                        </Link>
                        <div className="truncate text-xs text-muted-foreground">{o.opportunitydescription}</div>
                      </TableCell>
                      <TableCell>{o.customername}</TableCell>
                      <TableCell>{o.opportunityowner}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{o.opportunityphase}</Badge>
                      </TableCell>
                      <TableCell>{o.opportunitystatut}</TableCell>
                      <TableCell className="text-right tabular-nums">{money(o.value_forecast)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/opportunities/${o.id}`}>Open</Link>
                            </DropdownMenuItem>
                            {/* Hotfix: remove Add Note from list menu; notes live inside opportunity details */}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>

      {/* 2) Actions à suivre */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">Actions à suivre</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {actions.slice(0, 12).map((a) => {
            const opp = oppById.get(a.opportunityid);
            return (
              <div key={a.id} className="rounded-2xl border bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate font-medium">{a.title}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {a.clientname} · {a.salesowner} · {opp ? opp.id : a.opportunityid}
                    </div>
                  </div>
                  <Badge variant="secondary">⚙️ IA</Badge>
                </div>
                <div className="mt-2 text-sm">{a.currentaction}</div>
                {opp ? (
                  <div className="mt-2">
                    <Link className="text-xs text-primary hover:underline" href={`/opportunities/${opp.id}`}>
                      Open opportunity
                    </Link>
                  </div>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* 3) Alertes */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">Alertes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {alerts.slice(0, 12).map((al) => (
            <div key={al.id} className="rounded-2xl border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{al.opportunityname}</div>
                  <div className="truncate text-xs text-muted-foreground">{al.salesowner}</div>
                </div>
                <Badge variant={Number(al.delay_days) >= 10 ? "destructive" : "secondary"}>
                  {Number(al.delay_days) >= 10 ? "🔴" : "🟠"} {al.delay_days}d
                </Badge>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">{al.currentaction}</div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 4) News Feed */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">News Feed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {news.slice(0, 12).map((n) => (
            <div key={n.id} className="rounded-2xl border bg-card p-3">
              <div className="text-xs text-muted-foreground">
                {n.salesowner} · {n.clientname} · {n.opportunityid}
              </div>
              <div className="mt-1 text-sm">{n.actioncompleted}</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
