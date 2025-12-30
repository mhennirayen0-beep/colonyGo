'use client';

import Link from 'next/link';
import * as React from 'react';
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
  const [openKey, setOpenKey] = React.useState<string | null>(null);

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
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Opportunity</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Suggestion</TableHead>
              <TableHead className="w-[140px] text-right">Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {actionsToFollow.map((a) => {
              const key = String(a.actionid ?? `${a.opportunityid}-${a.title}`);
              const delay = delayByOpp.get(a.opportunityid) ?? 0;
              const rag = ragFor(delay);
              const open = openKey === key;
              return (
                <React.Fragment key={key}>
                  <TableRow>
                    <TableCell>
                      <Badge className={cn('rounded-full', rag.cls)}>{rag.label}</Badge>
                    </TableCell>
                    <TableCell className="font-medium whitespace-normal break-words">
                      <Link href={`/opportunities/${a.opportunityid}`} className="text-primary hover:underline">
                        {a.opportunityid}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-normal break-words">{a.clientname}</TableCell>
                    <TableCell className="whitespace-normal break-words">
                      <span className="line-clamp-2">{a.currentaction}</span>
                    </TableCell>
                    <TableCell className="whitespace-normal break-words">{a.salesowner}</TableCell>
                    <TableCell className="text-muted-foreground whitespace-normal break-words">
                      <span className="inline-flex items-center gap-2">
                        <AIProvenanceIcon />
                        Suggest follow-up within 48h
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
                            <div className="text-xs font-semibold text-muted-foreground">Current action</div>
                            <div className="mt-1 whitespace-normal break-words text-sm">{a.currentaction}</div>
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-muted-foreground">Next</div>
                            <div className="mt-1 text-sm text-muted-foreground">
                              Details module will be connected here (ticketing / tasks / reminders).
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
