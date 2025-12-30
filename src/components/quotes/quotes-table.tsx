"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { useAbility } from "@/lib/ability";
import type { Quote } from "@/lib/types";

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value} ${currency || 'EUR'}`;
  }
}

export function QuotesTable({
  quotes,
  onEdit,
  onDelete,
  loading,
  error,
}: {
  quotes: Quote[];
  onEdit: (quote: Quote) => void;
  onDelete?: (quote: Quote) => void;
  loading?: boolean;
  error?: string | null;
}) {
  const ability = useAbility();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Quotes</CardTitle>
        <CardDescription>Devis — list view (pipeline build starts here).</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Opportunity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : quotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-sm text-muted-foreground">
                  No quotes yet.
                </TableCell>
              </TableRow>
            ) : (
              quotes.map((q) => (
                <TableRow key={q.id}>
                  <TableCell className="font-medium">
                    <Link className="hover:underline" href={`/quotes/${encodeURIComponent(q.id)}`}>
                      {q.id}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link className="hover:underline" href={`/quotes/${encodeURIComponent(q.id)}`}>
                      {q.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{q.customername}</span>
                      <span className="text-xs text-muted-foreground">{q.customerid}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {q.opportunityname ? (
                      <div className="flex flex-col">
                        <span className="font-medium">{q.opportunityname}</span>
                        <span className="text-xs text-muted-foreground">{q.opportunityid ?? ''}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>{q.status}</TableCell>
                  <TableCell className="text-right">
                    {formatMoney(q.total_incl_tax ?? 0, q.currency ?? 'EUR')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/quotes/${encodeURIComponent(q.id)}`}>View</Link>
                        </DropdownMenuItem>
                        {ability.can('create', 'Invoice') && q.status === 'Accepted' ? (
                          <DropdownMenuItem asChild>
                            <Link href={`/quotes/${encodeURIComponent(q.id)}#create-invoice`}>
                              Create invoice
                            </Link>
                          </DropdownMenuItem>
                        ) : null}
                        {ability.can('update', 'Quote') ? (
                          <DropdownMenuItem onClick={() => onEdit(q)}>Edit</DropdownMenuItem>
                        ) : null}
                        {onDelete && ability.can('delete', 'Quote') ? (
                          <DropdownMenuItem className="text-destructive" onClick={() => onDelete(q)}>
                            Delete
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
