'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { salesNewsFeed } from '@/lib/data';
import { ExportMenu } from './export-menu';

export function NewsFeedTable() {
  const rows = salesNewsFeed.map(n => ({
    opportunityid: n.opportunityid,
    actioncompleted: n.actioncompleted,
    clientname: n.clientname,
    salesowner: n.salesowner,
    timestamp: n.timestamp,
  }));

  return (
    <Card id="sm-news">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="font-headline">News Feed</CardTitle>
          <CardDescription>Activity stream (subscriptions ready for integration).</CardDescription>
        </div>
        <ExportMenu filename="news_feed" rows={rows} pdfElementId="sm-news" />
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Opportunity</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead>Event</TableHead>
              <TableHead>Time</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {salesNewsFeed.map((n) => (
              <TableRow key={n.eventid}>
                <TableCell className="font-medium">
                  <Link href={`/opportunities/${n.opportunityid}`} className="text-primary hover:underline">
                    {n.opportunityid}
                  </Link>
                </TableCell>
                <TableCell>{n.clientname}</TableCell>
                <TableCell>{n.salesowner}</TableCell>
                <TableCell className="max-w-[560px] truncate">{n.actioncompleted}</TableCell>
                <TableCell>{n.timestamp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
