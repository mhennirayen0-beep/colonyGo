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
import { useAbility } from "@/lib/ability";
import type { Payment } from "@/lib/types";

function formatMoney(value: number, currency: string) {
  try {
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: currency || "EUR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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

function methodLabel(m?: Payment["method"]) {
  switch (m) {
    case "Transfer":
      return "Virement";
    case "Card":
      return "Carte";
    case "Cash":
      return "Espèces";
    case "Check":
      return "Chèque";
    case "Other":
      return "Autre";
    default:
      return String(m ?? "—");
  }
}

export function PaymentsTable({
  payments,
  loading,
  error,
  onDelete,
}: {
  payments: Payment[];
  loading?: boolean;
  error?: string | null;
  onDelete?: (p: Payment) => void;
}) {
  const ability = useAbility();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Payments</CardTitle>
        <CardDescription>Encaissements — link payments to invoices.</CardDescription>
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
              <TableHead>Payment</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Paid on</TableHead>
              <TableHead>Method</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-sm text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-sm text-muted-foreground">
                  No payments yet.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.id}</TableCell>
                  <TableCell>
                    <Link href={`/invoices/${encodeURIComponent(p.invoiceid)}`} className="hover:underline">
                      {p.invoiceid}
                    </Link>
                    {p.invoicetitle ? (
                      <div className="text-xs text-muted-foreground">{p.invoicetitle}</div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{p.customername}</span>
                      <span className="text-xs text-muted-foreground">{p.customerid}</span>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(p.paid_on)}</TableCell>
                  <TableCell>{methodLabel(p.method)}</TableCell>
                  <TableCell className="text-right">{formatMoney(p.amount, p.currency ?? "EUR")}</TableCell>
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
                          <Link href={`/invoices/${encodeURIComponent(p.invoiceid)}`}>View Invoice</Link>
                        </DropdownMenuItem>
                        {onDelete && ability.can("delete", "Payment") ? (
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDelete(p)}
                          >
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
