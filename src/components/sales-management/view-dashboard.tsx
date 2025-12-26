'use client';

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Opportunity } from "@/lib/types";
import { PipelineSnake, Phase } from "@/components/sales-management/pipeline-snake";
import { DrilldownSheet } from "@/components/sales-management/drilldown-sheet";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip as RTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ScatterChart, Scatter, ZAxis } from "recharts";
import { Badge } from "@/components/ui/badge";

function sumForecast(opps: Opportunity[]) {
  return opps.reduce((s, o) => s + Number(o.value_forecast ?? 0), 0);
}

export function SalesViewDashboard({ opportunities }: { opportunities: Opportunity[] }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetTitle, setSheetTitle] = useState("Details");
  const [sheetOpps, setSheetOpps] = useState<Opportunity[]>([]);

  const openSheet = (title: string, opps: Opportunity[]) => {
    setSheetTitle(title);
    setSheetOpps(opps);
    setSheetOpen(true);
  };

  const byPhase = useMemo(() => {
    const phases: Record<Phase, Opportunity[]> = {
      Prospection: [],
      Discovery: [],
      Evaluation: [],
      Deal: [],
    };
    for (const o of opportunities) {
      const p = o.opportunityphase as Phase;
      if (phases[p]) phases[p].push(o);
    }
    return phases;
  }, [opportunities]);

  const valuesByPhase = useMemo(() => {
    return {
      Prospection: sumForecast(byPhase.Prospection),
      Discovery: sumForecast(byPhase.Discovery),
      Evaluation: sumForecast(byPhase.Evaluation),
      Deal: sumForecast(byPhase.Deal),
    } as Record<Phase, number>;
  }, [byPhase]);

  const wonLostData = useMemo(() => {
    const won = opportunities.filter((o) => o.opportunitystatut === "Start");
    const lost = opportunities.filter((o) => ["Stop", "Cancelled"].includes(o.opportunitystatut));
    const forecast = opportunities.filter((o) => o.opportunitystatut === "Forecast");
    return [
      { name: "Won", value: sumForecast(won), opps: won },
      { name: "Lost", value: sumForecast(lost), opps: lost },
      { name: "Forecast", value: sumForecast(forecast), opps: forecast },
    ];
  }, [opportunities]);

  const workload = useMemo(() => {
    const map = new Map<string, { owner: string; count: number; forecast: number; opps: Opportunity[] }>();
    for (const o of opportunities) {
      const k = o.opportunityowner || "Unknown";
      const cur = map.get(k) ?? { owner: k, count: 0, forecast: 0, opps: [] };
      cur.count += 1;
      cur.forecast += Number(o.value_forecast ?? 0);
      cur.opps.push(o);
      map.set(k, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [opportunities]);

  const clientBubbles = useMemo(() => {
    // Prototype metrics derived from SWOT / values (since Excel dummydata doesn't include payment reliability fields)
    return opportunities.map((o) => {
      const reactivity = Math.max(0, Math.min(100, Number(o.swot_strength ?? 0) * 10));
      const reliability = Math.max(0, Math.min(100, 100 - Number(o.swot_threats ?? 0) * 10));
      const volume = Math.max(1, Number(o.value_forecast ?? 0) / 1000);
      return {
        name: o.customername,
        x: reactivity,
        y: reliability,
        z: volume,
        opp: o,
      };
    });
  }, [opportunities]);

  const kanban = useMemo(() => {
    const cols = {
      "À faire": opportunities.filter((o) => o.opportunityphase === "Prospection"),
      "En cours": opportunities.filter((o) => o.opportunityphase === "Discovery"),
      "Validé": opportunities.filter((o) => o.opportunityphase === "Evaluation"),
      "Clos": opportunities.filter((o) => o.opportunityphase === "Deal"),
    } as const;
    return cols;
  }, [opportunities]);

  return (
    <div className="space-y-4">
      {/* Pipeline snake (Hotfix) */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <PipelineSnake
            valuesByPhase={valuesByPhase}
            onPhaseClick={(phase) => openSheet(`Phase: ${phase}`, byPhase[phase])}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Won/Lost */}
        <Card className="rounded-2xl shadow-sm lg:col-span-1">
          <CardHeader>
            <CardTitle className="font-headline">Won / Lost</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={wonLostData}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  onClick={(d: any) => {
                    if (d?.opps) openSheet(`Won/Lost: ${d.name}`, d.opps);
                  }}
                >
                  {wonLostData.map((_, idx) => (
                    <Cell key={idx} />
                  ))}
                </Pie>
                <RTooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary">Click a slice to drill down</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Workload */}
        <Card className="rounded-2xl shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="font-headline">Workload & performance</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={workload}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="owner" tick={{ fontSize: 12 }} />
                <YAxis />
                <RTooltip />
                <Bar
                  dataKey="count"
                  onClick={(data: any) => {
                    if (data?.activePayload?.[0]?.payload?.opps) {
                      const p = data.activePayload[0].payload;
                      openSheet(`Owner: ${p.owner}`, p.opps);
                    }
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Client bubble chart */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">Client profiling (prototype)</CardTitle>
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid />
              <XAxis type="number" dataKey="x" name="Reactivity" unit="" />
              <YAxis type="number" dataKey="y" name="Reliability" unit="" />
              <ZAxis type="number" dataKey="z" range={[60, 300]} name="Volume" />
              <RTooltip cursor={{ strokeDasharray: "3 3" }} />
              <Scatter
                data={clientBubbles}
                onClick={(d: any) => {
                  const o = d?.payload?.opp as Opportunity | undefined;
                  if (o) openSheet(`Client: ${o.customername}`, opportunities.filter((x) => x.customername === o.customername));
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="mt-2 text-xs text-muted-foreground">
            Click a bubble to list opportunities for that client.
          </div>
        </CardContent>
      </Card>

      {/* Kanban */}
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">Sales committee Kanban</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {Object.entries(kanban).map(([col, opps]) => (
              <div key={col} className="rounded-2xl border bg-muted/30 p-2">
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-sm font-semibold">{col}</div>
                  <Badge variant="secondary">{opps.length}</Badge>
                </div>
                <div className="space-y-2">
                  {opps.slice(0, 6).map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => openSheet(col, [o])}
                      className="w-full rounded-xl border bg-background p-2 text-left hover:bg-muted/40"
                    >
                      <div className="truncate text-sm font-medium">{o.opportunityname}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {o.customername} · {o.opportunityowner}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <DrilldownSheet open={sheetOpen} onOpenChange={setSheetOpen} title={sheetTitle} opportunities={sheetOpps} />
    </div>
  );
}
