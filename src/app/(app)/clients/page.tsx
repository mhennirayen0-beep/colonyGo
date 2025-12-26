"use client";

import { useMemo, useState } from "react";
import * as data from "@/lib/data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Building2, Search, ShieldAlert, TrendingUp, Users } from "lucide-react";

type ClientRow = {
  id: string;
  name: string;
  sector?: string;
  avatarUrl?: string;
  initials?: string;
  oppCount: number;
  activeOppCount: number;
  forecastTotal: number;
  wonTotal: number;
  atRiskCount: number;
  primaryOwner?: string;
};

function formatMoney(v: number) {
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
  } catch {
    return `${Math.round(v).toLocaleString()} €`;
  }
}

function getInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CL";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}

export default function ClientsPage() {
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState<string>("all");

  // Graceful access: works whether your data.ts exports customers or only opportunities (Excel dummy).
  const customers = ((data as any).customers ?? []) as Array<any>;
  const opportunities = ((data as any).opportunities ?? []) as Array<any>;
  const alerts = ((data as any).alerts ?? []) as Array<any>;

  const sectors = useMemo(() => {
    const s = new Set<string>();
    for (const c of customers) if (c?.sector) s.add(String(c.sector));
    // fallback: if no customer.sector, derive simple "Unknown".
    if (s.size === 0) s.add("Unknown");
    return ["all", ...Array.from(s).sort((a, b) => a.localeCompare(b))];
  }, [customers]);

  const rows: ClientRow[] = useMemo(() => {
    // Build a customer map from customers list if present.
    const customerMap = new Map<string, any>();
    for (const c of customers) {
      if (c?.id) customerMap.set(String(c.id), c);
    }

    // Ensure we also include customers referenced only by opportunities.
    for (const o of opportunities) {
      const cid = String(o?.customerid ?? o?.customerId ?? "");
      const cname = String(o?.customername ?? o?.customerName ?? "");
      if (!cid) continue;
      if (!customerMap.has(cid)) {
        customerMap.set(cid, {
          id: cid,
          name: cname || cid,
          company: cname || cid,
          sector: "Unknown",
          initials: getInitials(cname || cid),
        });
      }
    }

    // Group opportunities by customer
    const oppByCustomer = new Map<string, any[]>();
    for (const o of opportunities) {
      const cid = String(o?.customerid ?? o?.customerId ?? "");
      if (!cid) continue;
      const arr = oppByCustomer.get(cid) ?? [];
      arr.push(o);
      oppByCustomer.set(cid, arr);
    }

    // Group alerts by opportunity/customer (best-effort)
    const riskByCustomer = new Map<string, number>();
    const oppIdToCustomerId = new Map<string, string>();
    for (const o of opportunities) {
      if (o?.id && o?.customerid) oppIdToCustomerId.set(String(o.id), String(o.customerid));
    }

    for (const a of alerts) {
      const oppId = String(a?.opportunityId ?? a?.opportunityid ?? "");
      const cid = oppIdToCustomerId.get(oppId);
      if (!cid) continue;
      riskByCustomer.set(cid, (riskByCustomer.get(cid) ?? 0) + 1);
    }

    const out: ClientRow[] = [];

    for (const [cid, c] of customerMap.entries()) {
      const opps = oppByCustomer.get(cid) ?? [];
      const oppCount = opps.length;
      const activeOppCount = opps.filter((o) => {
        const st = String(o?.opportunitystatut ?? o?.opportunityStatut ?? "").toLowerCase();
        return st !== "cancelled" && st !== "canceled";
      }).length;

      const forecastTotal = opps.reduce((sum, o) => sum + Number(o?.value_forecast ?? o?.valueForecast ?? 0), 0);
      const wonTotal = opps.reduce((sum, o) => sum + Number(o?.value_final ?? o?.valueFinal ?? 0), 0);

      // Primary owner: the most common owner among that client's opportunities.
      const ownerCount = new Map<string, number>();
      for (const o of opps) {
        const owner = String(o?.opportunityowner ?? o?.opportunityOwner ?? "").trim();
        if (!owner) continue;
        ownerCount.set(owner, (ownerCount.get(owner) ?? 0) + 1);
      }
      const primaryOwner = Array.from(ownerCount.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];

      out.push({
        id: String(c?.id ?? cid),
        name: String(c?.name ?? c?.company ?? cid),
        sector: String(c?.sector ?? "Unknown"),
        avatarUrl: c?.avatarUrl,
        initials: String(c?.initials ?? getInitials(String(c?.name ?? c?.company ?? cid))),
        oppCount,
        activeOppCount,
        forecastTotal,
        wonTotal,
        atRiskCount: riskByCustomer.get(cid) ?? 0,
        primaryOwner,
      });
    }

    // Sort by forecast total desc
    return out.sort((a, b) => b.forecastTotal - a.forecastTotal);
  }, [customers, opportunities, alerts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesQuery =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q) ||
        (r.primaryOwner ?? "").toLowerCase().includes(q);

      const matchesSector = sector === "all" ? true : (r.sector ?? "Unknown") === sector;

      return matchesQuery && matchesSector;
    });
  }, [rows, query, sector]);

  const totals = useMemo(() => {
    const clientCount = filtered.length;
    const oppCount = filtered.reduce((s, r) => s + r.oppCount, 0);
    const forecast = filtered.reduce((s, r) => s + r.forecastTotal, 0);
    const atRisk = filtered.reduce((s, r) => s + r.atRiskCount, 0);
    return { clientCount, oppCount, forecast, atRisk };
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-headline text-3xl font-bold text-primary">Clients</h1>
          <p className="text-sm text-muted-foreground">A consolidated view of your client accounts, pipeline, and risk.</p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search client / ID / owner..."
              className="h-10 w-full pl-9 sm:w-[280px]"
            />
          </div>

          <Select value={sector} onValueChange={setSector}>
            <SelectTrigger className="h-10 w-full sm:w-[200px]">
              <SelectValue placeholder="Sector" />
            </SelectTrigger>
            <SelectContent>
              {sectors.map((s) => (
                <SelectItem key={s} value={s}>
                  {s === "all" ? "All sectors" : s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totals.clientCount}</div>
            <p className="text-xs text-muted-foreground">Unique accounts in scope</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Opportunities</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totals.oppCount}</div>
            <p className="text-xs text-muted-foreground">Total linked opportunities</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline forecast</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatMoney(totals.forecast)}</div>
            <p className="text-xs text-muted-foreground">Sum of value_forecast</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk signals</CardTitle>
            <ShieldAlert className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totals.atRisk}</div>
            <p className="text-xs text-muted-foreground">Alerts mapped to client portfolio</p>
          </CardContent>
        </Card>
      </div>

      {/* Desktop table */}
      <Card className="hidden rounded-2xl shadow-sm md:block">
        <CardHeader>
          <CardTitle className="text-base">Client list</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Sector</TableHead>
                <TableHead>Primary owner</TableHead>
                <TableHead className="text-right">Opp</TableHead>
                <TableHead className="text-right">Active</TableHead>
                <TableHead className="text-right">Forecast</TableHead>
                <TableHead className="text-right">Won</TableHead>
                <TableHead className="text-right">Risk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 rounded-xl">
                        {r.avatarUrl ? <AvatarImage src={r.avatarUrl} alt={r.name} /> : null}
                        <AvatarFallback className="rounded-xl bg-secondary text-primary">{r.initials}</AvatarFallback>
                      </Avatar>
                      <div className="leading-tight">
                        <div className="font-medium text-primary">{r.name}</div>
                        <div className="text-xs text-muted-foreground">{r.id}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="rounded-xl">{r.sector ?? "Unknown"}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.primaryOwner ?? "—"}</TableCell>
                  <TableCell className="text-right font-medium">{r.oppCount}</TableCell>
                  <TableCell className="text-right">{r.activeOppCount}</TableCell>
                  <TableCell className="text-right">{formatMoney(r.forecastTotal)}</TableCell>
                  <TableCell className="text-right">{formatMoney(r.wonTotal)}</TableCell>
                  <TableCell className="text-right">
                    {r.atRiskCount > 0 ? (
                      <Badge variant="destructive" className="rounded-xl">{r.atRiskCount}</Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-xl">0</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    No clients match your filters.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Mobile cards */}
      <div className="grid gap-3 md:hidden">
        {filtered.map((r) => (
          <Card key={r.id} className="rounded-2xl shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10 rounded-2xl">
                    {r.avatarUrl ? <AvatarImage src={r.avatarUrl} alt={r.name} /> : null}
                    <AvatarFallback className="rounded-2xl bg-secondary text-primary">{r.initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium text-primary">{r.name}</div>
                    <div className="text-xs text-muted-foreground">{r.id}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="rounded-xl">{r.sector ?? "Unknown"}</Badge>
                      {r.atRiskCount > 0 ? (
                        <Badge variant="destructive" className="rounded-xl">Risk {r.atRiskCount}</Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-xl">No risk</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border bg-background p-3">
                  <div className="text-xs text-muted-foreground">Opportunities</div>
                  <div className="font-semibold text-primary">{r.oppCount} <span className="text-xs font-normal text-muted-foreground">({r.activeOppCount} active)</span></div>
                </div>
                <div className="rounded-xl border bg-background p-3">
                  <div className="text-xs text-muted-foreground">Forecast</div>
                  <div className="font-semibold text-primary">{formatMoney(r.forecastTotal)}</div>
                </div>
                <div className="rounded-xl border bg-background p-3">
                  <div className="text-xs text-muted-foreground">Won</div>
                  <div className="font-semibold text-primary">{formatMoney(r.wonTotal)}</div>
                </div>
                <div className="rounded-xl border bg-background p-3">
                  <div className="text-xs text-muted-foreground">Owner</div>
                  <div className="font-semibold text-primary truncate">{r.primaryOwner ?? "—"}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filtered.length === 0 ? (
          <Card className="rounded-2xl shadow-sm">
            <CardContent className="p-6 text-center text-sm text-muted-foreground">No clients match your filters.</CardContent>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
