'use client';

import Link from 'next/link';
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Level</TableHead>
              <TableHead>Opportunity</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Delay</TableHead>
              <TableHead>Suggested action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesAlerts.map((a) => {
              const lvl = levelFor(a.delay_days);
              return (
                <TableRow key={a.alertid}>
                  <TableCell>
                    <Badge className={cn('rounded-full', lvl.cls)}>{lvl.label}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/opportunities/${a.opportunityid ?? ''}`} className="text-primary hover:underline">
                      {a.opportunityname}
                    </Link>
                  </TableCell>
                  <TableCell>{a.salesowner}</TableCell>
                  <TableCell className="max-w-[520px] truncate">{a.currentaction}</TableCell>
                  <TableCell>{a.delay_days} days</TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <AIProvenanceIcon />
                      Propose next-step + new date
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
