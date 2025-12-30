"use client";

import { useState } from "react";
import { Download, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaymentsTable } from "@/components/payments/payments-table";
import { PaymentDialog } from "@/components/payments/payment-dialog";
import { exportRowsAsCSV } from "@/lib/exporters";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAbility } from "@/lib/ability";
import { useToast } from "@/hooks/use-toast";
import { usePayments } from "@/hooks/use-payments";
import type { Payment } from "@/lib/types";

export default function PaymentsPage() {
  const ability = useAbility();
  const { toast } = useToast();

  const [q, setQ] = useState("");
  const [method, setMethod] = useState<string>("all");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [dialogOpen, setDialogOpen] = useState(false);

  const { payments, meta, loading, error, createPayment, deletePayment } = usePayments({
    q: q.trim() || undefined,
    method: method !== "all" ? (method as any) : undefined,
    page,
    limit,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary">Payments</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              exportRowsAsCSV(
                payments.map((p) => ({
                  id: p.id,
                  invoiceid: p.invoiceid,
                  invoicetitle: p.invoicetitle ?? "",
                  customer: p.customername,
                  customerid: p.customerid,
                  paid_on: p.paid_on,
                  method: p.method,
                  amount: p.amount,
                  currency: p.currency ?? "EUR",
                  reference: p.reference ?? "",
                  note: p.note ?? "",
                })),
                `payments_${new Date().toISOString().slice(0, 10)}.csv`,
              );
            }}
            disabled={loading || payments.length === 0}
            title={payments.length === 0 ? "No payments to export" : "Export current list"}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

          <Button
          onClick={() => {
            if (!ability.can("create", "Payment")) {
              toast({
                title: "Not allowed",
                description: "You do not have permission to create payments.",
                variant: "destructive",
              });
              return;
            }
            setDialogOpen(true);
          }}
            variant="accent"
            disabled={!ability.can("create", "Payment")}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            New Payment
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="max-w-md">
          <Input
            placeholder="Search payments (payment id, invoice id, customer…)"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={method}
            onValueChange={(v) => {
              setMethod(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes méthodes</SelectItem>
              <SelectItem value="Transfer">Virement</SelectItem>
              <SelectItem value="Card">Carte</SelectItem>
              <SelectItem value="Cash">Espèces</SelectItem>
              <SelectItem value="Check">Chèque</SelectItem>
              <SelectItem value="Other">Autre</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
          Page <span className="font-medium text-foreground">{meta?.page ?? page}</span>
          {meta?.total != null ? (
            <>
              {" "}• Total <span className="font-medium text-foreground">{meta.total}</span>
            </>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={loading || (meta?.page ?? page) <= 1}
          >
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={loading || meta?.hasNext === false}
          >
            Next
          </Button>
          </div>
        </div>
      </div>

      <PaymentsTable
        payments={payments}
        loading={loading}
        error={error}
        onDelete={async (p: Payment) => {
          if (!ability.can("delete", "Payment")) {
            toast({
              title: "Not allowed",
              description: "You do not have permission to delete payments.",
              variant: "destructive",
            });
            return;
          }
          if (!confirm(`Delete payment ${p.id}?`)) return;
          try {
            await deletePayment(p.id);
            toast({ title: "Deleted", description: `${p.id} deleted.` });
          } catch (e: any) {
            toast({
              title: "Delete failed",
              description: e?.message ? String(e.message) : "Could not delete",
              variant: "destructive",
            });
          }
        }}
      />

      <PaymentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={async (data) => {
          try {
            await createPayment(data as any);
            toast({ title: "Payment added", description: `Payment linked to ${data.invoiceid}.` });
          } catch (e: any) {
            toast({
              title: "Create failed",
              description: e?.message ? String(e.message) : "Could not create payment",
              variant: "destructive",
            });
            throw e;
          }
        }}
      />
    </div>
  );
}
