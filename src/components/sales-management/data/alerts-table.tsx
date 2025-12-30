'use client';

import Link from 'next/link';
import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { salesAlerts } from '@/lib/data';
import { cn } from '@/lib/utils';
import { AIProvenanceIcon } from '@/components/ai/ai-provenance-icon';
import { ExportMenu } from './export-menu';

const levelFor = (delay: number) => {
  if (delay >= 10) return { label: 'URGENT', cls: 'bg-destructive text-destructive-foreground' };
  if (delay >= 5) return { label: 'WARNING', cls: 'bg-amber-500 text-white' };
  return { label: 'INFO', cls: 'bg-sky-600 text-white' };
};

export function AlertsTable() {
  const [openKey, setOpenKey] = React.useState<string | null>(null);
  const rows = salesAlerts.map(a => ({
    opportunityname: a.opportunityname,
    currentaction: a.currentaction,
    delay_days: a.delay_days,
    salesowner: a.salesowner,
  }));

  return (
    <Card id="sm-alerts">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="font-headline">Alerts</CardTitle>
          <CardDescription>AI + system alerts for at-risk opportunities.</CardDescription>
        </div>
        <ExportMenu filename="alerts" rows={rows} pdfElementId="sm-alerts" />
      </CardHeader>
      <CardContent>
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead>Level</TableHead>
              <TableHead>Opportunity</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Delay</TableHead>
              <TableHead>Suggested action</TableHead>
              <TableHead className="w-[140px] text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesAlerts.map((a) => {
              const key = String(a.alertid ?? `${a.opportunityid}-${a.opportunityname}`);
              const open = openKey === key;
              const lvl = levelFor(a.delay_days);
              return (
                <React.Fragment key={key}>
                  <TableRow>
                    <TableCell>
                      <Badge className={cn('rounded-full', lvl.cls)}>{lvl.label}</Badge>
                    </TableCell>
                    <TableCell className="font-medium whitespace-normal break-words">
                      <Link href={`/opportunities/${a.opportunityid ?? ''}`} className="text-primary hover:underline">
                        {a.opportunityname}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-normal break-words">{a.salesowner}</TableCell>
                    <TableCell className="whitespace-normal break-words">
                      <span className="line-clamp-2">{a.currentaction}</span>
                    </TableCell>
                    <TableCell>{a.delay_days} days</TableCell>
                    <TableCell className="text-muted-foreground whitespace-normal break-words">
                      <span className="inline-flex items-center gap-2">
                        <AIProvenanceIcon />
                        Propose next-step + new date
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <button
                        type="button"
                        onClick={() => setOpenKey(open ? null : key)}
                        className="inline-flex h-8 items-center justify-center rounded-md px-2 text-sm hover:bg-muted"
                      >
                        {open ? 'Hide' : 'Details'}
                      </button>
                    </TableCell>
                  </TableRow>

                  {open && (
                    <TableRow className="bg-muted/20">
                      <TableCell colSpan={7} className="p-4">
                        <div className="grid gap-3 md:grid-cols-2">
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground">Reason</div>
                            <div className="mt-1 whitespace-normal break-words text-sm">{a.currentaction}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground">Next</div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              Details module will be connected here (notifications / tasks / workflow).
                            </div>
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
      </CardContent>
    </Card>
  );
}
