"use client";

import Link from "next/link";

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
import { Badge } from "@/components/ui/badge";
import { useAbility } from "@/lib/ability";
import type { Invoice } from "@/lib/types";

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "EUR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value} ${currency || "EUR"}`;
  }
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
}

export function InvoicesTable({
  invoices,
  onEdit,
  onDelete,
  onStatusChange,
  loading,
  error,
}: {
  invoices: Invoice[];
  onEdit?: (invoice: Invoice) => void;
  onDelete?: (invoice: Invoice) => void;
  onStatusChange?: (invoice: Invoice, status: Invoice["status"]) => void;
  loading?: boolean;
  error?: string | null;
}) {
  const ability = useAbility();

  const statusBadge = (s: Invoice["status"]) => {
    const base = "rounded-full";
    if (s === "Paid") return <Badge className={base}>Paid</Badge>;
    if (s === "Issued") return <Badge variant="secondary" className={base}>Issued</Badge>;
    if (s === "Cancelled") return <Badge variant="destructive" className={base}>Cancelled</Badge>;
    return <Badge variant="outline" className={base}>Draft</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Invoices</CardTitle>
        <CardDescription>Factures — view, edit and print.</CardDescription>
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
              <TableHead>Invoice</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-sm text-muted-foreground">
                  No invoices yet.
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">
                    <Link
                      href={`/invoices/${encodeURIComponent(inv.id)}`}
                      className="hover:underline"
                    >
                      {inv.id}
                    </Link>
                  </TableCell>
                  <TableCell>{inv.title}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{inv.customername}</span>
                      <span className="text-xs text-muted-foreground">{inv.customerid}</span>
                    </div>
                  </TableCell>
                  <TableCell>{statusBadge(inv.status)}</TableCell>
                  <TableCell>{formatDate(inv.due_on)}</TableCell>
                  <TableCell className="text-right">
                    {formatMoney(
                      inv.remaining_due ?? Math.max(0, (inv.total_incl_tax ?? 0) - (inv.paid_total ?? 0)),
                      inv.currency ?? "EUR",
                    )}
                  </TableCell>
                  <TableCell className="text-right">{formatMoney(inv.total_incl_tax ?? 0, inv.currency ?? "EUR")}</TableCell>
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
                          <Link href={`/invoices/${encodeURIComponent(inv.id)}`}>View</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/invoices/${encodeURIComponent(inv.id)}/print`}>Print</Link>
                        </DropdownMenuItem>

                        {ability.can("create", "Payment") && inv.status === "Issued" ? (
                          <DropdownMenuItem asChild>
                            <Link href={`/invoices/${encodeURIComponent(inv.id)}#add-payment`}>Add payment</Link>
                          </DropdownMenuItem>
                        ) : null}

                        {onStatusChange && ability.can("update", "Invoice") && inv.status === "Draft" ? (
                          <DropdownMenuItem onClick={() => onStatusChange(inv, "Issued")}>Mark Issued</DropdownMenuItem>
                        ) : null}

                        {onStatusChange && ability.can("update", "Invoice") && inv.status === "Issued" ? (
                          <DropdownMenuItem onClick={() => onStatusChange(inv, "Paid")}>Mark Paid</DropdownMenuItem>
                        ) : null}

                        {onStatusChange && ability.can("update", "Invoice") && (inv.status === "Draft" || inv.status === "Issued") ? (
                          <DropdownMenuItem className="text-destructive" onClick={() => onStatusChange(inv, "Cancelled")}>
                            Cancel
                          </DropdownMenuItem>
                        ) : null}
                        {onEdit && ability.can("update", "Invoice") ? (
                          <DropdownMenuItem onClick={() => onEdit(inv)}>Edit</DropdownMenuItem>
                        ) : null}
                        {onDelete && ability.can("delete", "Invoice") ? (
                          <DropdownMenuItem className="text-destructive" onClick={() => onDelete(inv)}>
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
