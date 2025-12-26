'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { actionsToFollow, salesAlerts } from '@/lib/data';
import { cn } from '@/lib/utils';
import { AIProvenanceIcon } from '@/components/ai/ai-provenance-icon';
import { ExportMenu } from './export-menu';

const ragFor = (delay: number) => {
  if (delay >= 10) return { label: 'RED', cls: 'bg-destructive text-destructive-foreground' };
  if (delay >= 5) return { label: 'AMBER', cls: 'bg-amber-500 text-white' };
  return { label: 'GREEN', cls: 'bg-emerald-600 text-white' };
};

export function ActionsToFollowTable() {
  const delayByOpp = new Map(salesAlerts.map(a => [a.opportunityid ?? '', a.delay_days]));

  const rows = actionsToFollow.map(a => ({
    opportunityid: a.opportunityid,
    title: a.title,
    clientname: a.clientname,
    currentaction: a.currentaction,
    salesowner: a.salesowner,
  }));

  return (
    <Card id="sm-actions">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="font-headline">Actions à suivre</CardTitle>
          <CardDescription>From Ticketing Management — prioritized with RAG status.</CardDescription>
        </div>
        <ExportMenu filename="actions_to_follow" rows={rows} pdfElementId="sm-actions" />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Opportunity</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Suggestion</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actionsToFollow.map((a) => {
              const delay = delayByOpp.get(a.opportunityid) ?? 0;
              const rag = ragFor(delay);
              return (
                <TableRow key={a.actionid}>
                  <TableCell>
                    <Badge className={cn('rounded-full', rag.cls)}>{rag.label}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/opportunities/${a.opportunityid}`} className="text-primary hover:underline">
                      {a.opportunityid}
                    </Link>
                  </TableCell>
                  <TableCell>{a.clientname}</TableCell>
                  <TableCell className="max-w-[520px] truncate">{a.currentaction}</TableCell>
                  <TableCell>{a.salesowner}</TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="inline-flex items-center gap-2">
                      <AIProvenanceIcon />
                      Suggest follow-up within 48h
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
