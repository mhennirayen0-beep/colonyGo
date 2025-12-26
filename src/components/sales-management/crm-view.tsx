'use client';

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Opportunity } from "@/lib/types";
import Link from "next/link";

export function SalesCRMView({ opportunities }: { opportunities: Opportunity[] }) {
  const [q, setQ] = useState("");

  const clients = useMemo(() => {
    const map = new Map<string, { name: string; id: string; opps: Opportunity[]; pipeline: number; owners: Set<string> }>();
    for (const o of opportunities) {
      const key = o.customerid || o.customername;
      const cur = map.get(key) ?? { name: o.customername, id: o.customerid, opps: [], pipeline: 0, owners: new Set<string>() };
      cur.opps.push(o);
      cur.pipeline += Number(o.value_forecast ?? 0);
      cur.owners.add(o.opportunityowner || "Unknown");
      map.set(key, cur);
    }
    let arr = Array.from(map.values()).sort((a, b) => b.pipeline - a.pipeline);
    if (q.trim()) {
      const qq = q.toLowerCase();
      arr = arr.filter((c) => c.name.toLowerCase().includes(qq) || c.id.toLowerCase().includes(qq));
    }
    return arr;
  }, [opportunities, q]);

  return (
    <div className="space-y-4">
      <Card className="rounded-2xl shadow-sm">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="font-headline">CRM (Sales sub-module)</CardTitle>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search client…" className="sm:max-w-sm" />
        </CardHeader>
        <CardContent className="space-y-2">
          {clients.map((c) => (
            <div key={c.id} className="rounded-2xl border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.id}</div>
                </div>
                <Badge variant="secondary" className="tabular-nums">
                  {Math.round(c.pipeline).toLocaleString()}
                </Badge>
              </div>

              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">{c.opps.length} opportunities</Badge>
                <Badge variant="outline">{Array.from(c.owners).length} owners</Badge>
              </div>

              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {c.opps.slice(0, 4).map((o) => (
                  <Link
                    key={o.id}
                    href={`/opportunities/${o.id}`}
                    className="rounded-xl border bg-background p-2 hover:bg-muted/40"
                  >
                    <div className="truncate text-sm font-medium">{o.opportunityname}</div>
                    <div className="truncate text-xs text-muted-foreground">{o.opportunityphase} · {o.opportunitystatut}</div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
