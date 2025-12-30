"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Pencil, Printer } from "lucide-react";
import { CheckCircle2, Ban, ReceiptText } from "lucide-react";

import { api } from "@/lib/api-client";
import { useAbility } from "@/lib/ability";
import { useToast } from "@/hooks/use-toast";
import { useCustomers } from "@/hooks/use-customers";
import { useOpportunitiesStore } from "@/lib/opportunities-store";
import { usePayments } from "@/hooks/use-payments";
import type { Invoice } from "@/lib/types";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceDialog } from "@/components/invoices/invoice-dialog";
import { PaymentDialog } from "@/components/payments/payment-dialog";

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

function mapInvoice(doc: any): Invoice {
  return {
    id: String(doc?.invoiceId ?? doc?.id ?? ""),
    title: String(doc?.title ?? ""),
    customerid: String(doc?.customerid ?? ""),
    customername: String(doc?.customername ?? ""),
    opportunityid: doc?.opportunityid ? String(doc.opportunityid) : undefined,
    opportunityname: doc?.opportunityname ? String(doc.opportunityname) : undefined,
    quoteid: doc?.quoteid ? String(doc.quoteid) : undefined,
    quotetitle: doc?.quotetitle ? String(doc.quotetitle) : undefined,
    status: (doc?.status ?? "Draft") as any,
    currency: String(doc?.currency ?? "EUR"),
    total_excl_tax: Number(doc?.total_excl_tax ?? 0),
    total_tax: Number(doc?.total_tax ?? 0),
    total_incl_tax: Number(doc?.total_incl_tax ?? 0),
    issued_on: doc?.issued_on ? String(doc.issued_on) : undefined,
    due_on: doc?.due_on ? String(doc.due_on) : undefined,
    paid_on: doc?.paid_on ? String(doc.paid_on) : undefined,
    payment_reference: doc?.payment_reference ? String(doc.payment_reference) : undefined,
    createdAt: doc?.createdAt ? String(doc.createdAt) : undefined,
    updatedAt: doc?.updatedAt ? String(doc.updatedAt) : undefined,
  };
}

function fmtDate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR");
}

export function InvoiceDetailClient({ invoiceId }: { invoiceId: string }) {
  const ability = useAbility();
  const { toast } = useToast();
  const { customers } = useCustomers();
  const { opportunities } = useOpportunitiesStore();

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [hashHandled, setHashHandled] = useState(false);

  const {
    payments,
    loading: paymentsLoading,
    error: paymentsError,
    createPayment,
    deletePayment,
    reload: reloadPayments,
  } = usePayments({
    invoiceid: invoiceId,
    page: 1,
    limit: 50,
  });

  const canEdit = ability.can("update", "Invoice");
  const canViewQuote = ability.can("view", "Quote");

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<any>(`/invoices/${encodeURIComponent(invoiceId)}`);
      setInvoice(mapInvoice(res));
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Failed to load invoice");
      setInvoice(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  const dates = useMemo(() => {
    return {
      issued: fmtDate(invoice?.issued_on),
      due: fmtDate(invoice?.due_on),
      paid: fmtDate(invoice?.paid_on),
      created: fmtDate(invoice?.createdAt),
    };
  }, [invoice]);

  const paidSum = useMemo(() => {
    return (payments ?? []).reduce((s, p) => s + Number(p?.amount ?? 0), 0);
  }, [payments]);

  const remainingDue = useMemo(() => {
    const total = Number(invoice?.total_incl_tax ?? 0);
    return total - paidSum;
  }, [invoice, paidSum]);

  // Support deep-linking to open the payment dialog: /invoices/INV-000001#add-payment
  useEffect(() => {
    if (hashHandled) return;
    if (typeof window === "undefined") return;
    if (window.location.hash !== "#add-payment") return;
    if (!ability.can("create", "Payment")) {
      toast({
        title: "Not allowed",
        description: "You do not have permission to record payments.",
        variant: "destructive",
      });
      setHashHandled(true);
      return;
    }
    // Wait until invoice loaded so we can validate status
    if (!invoice) return;
    if (invoice.status !== "Issued") {
      toast({
        title: "Unavailable",
        description: "Payments can only be recorded on issued invoices.",
        variant: "destructive",
      });
      setHashHandled(true);
      return;
    }
    if (Math.max(0, remainingDue) <= 0) {
      toast({
        title: "Already paid",
        description: "This invoice has no remaining amount due.",
        variant: "destructive",
      });
      setHashHandled(true);
      return;
    }
    setPaymentDialogOpen(true);
    setHashHandled(true);
  }, [ability, toast, invoice, hashHandled, remainingDue]);

  const onUpdate = async (id: string, data: Partial<Invoice>) => {
    const updated = await api.patch<any>(`/invoices/${encodeURIComponent(id)}`, data);
    setInvoice(mapInvoice(updated));
  };

  const canUpdate = ability.can("update", "Invoice");
  const canIssue = canUpdate && invoice?.status === "Draft";
  const canPay = canUpdate && invoice?.status === "Issued";
  const canCancel = canUpdate && (invoice?.status === "Draft" || invoice?.status === "Issued");

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-headline">Invoice</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Loading…</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-headline">Invoice</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load}>
              Retry
            </Button>
            <Button asChild variant="secondary">
              <Link href="/invoices">Back to Invoices</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!invoice) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Back">
            <Link href="/invoices">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-headline font-bold text-primary">{invoice.id}</h1>
              <Badge variant="secondary">{invoice.status}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">{invoice.title}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/invoices/${encodeURIComponent(invoice.id)}/print`}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Link>
          </Button>

          {canIssue ? (
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await onUpdate(invoice.id, { status: "Issued" as any });
                  toast({ title: "Invoice issued", description: `${invoice.id} marked as Issued.` });
                } catch (e: any) {
                  toast({
                    title: "Update failed",
                    description: e?.message ? String(e.message) : "Could not change status",
                    variant: "destructive",
                  });
                }
              }}
            >
              <ReceiptText className="mr-2 h-4 w-4" /> Mark Issued
            </Button>
          ) : null}

          {canPay ? (
            <Button
              variant="secondary"
              onClick={async () => {
                try {
                  await onUpdate(invoice.id, { status: "Paid" as any });
                  toast({ title: "Invoice paid", description: `${invoice.id} marked as Paid.` });
                } catch (e: any) {
                  toast({
                    title: "Update failed",
                    description: e?.message ? String(e.message) : "Could not change status",
                    variant: "destructive",
                  });
                }
              }}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" /> Mark Paid
            </Button>
          ) : null}

          {canCancel ? (
            <Button
              variant="outline"
              onClick={async () => {
                if (!confirm(`Cancel invoice ${invoice.id}?`)) return;
                try {
                  await onUpdate(invoice.id, { status: "Cancelled" as any });
                  toast({ title: "Invoice cancelled", description: `${invoice.id} cancelled.` });
                } catch (e: any) {
                  toast({
                    title: "Update failed",
                    description: e?.message ? String(e.message) : "Could not change status",
                    variant: "destructive",
                  });
                }
              }}
            >
              <Ban className="mr-2 h-4 w-4" /> Cancel
            </Button>
          ) : null}

          <Button
            variant="accent"
            disabled={!canEdit}
            onClick={() => {
              if (!canEdit) {
                toast({
                  title: "Not allowed",
                  description: "You do not have permission to edit invoices.",
                  variant: "destructive",
                });
                return;
              }
              setDialogOpen(true);
            }}
          >
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-headline">Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Customer</div>
            <div className="font-medium">{invoice.customername || "—"}</div>
            <div className="text-xs text-muted-foreground">{invoice.customerid || ""}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Opportunity</div>
            {invoice.opportunityid ? (
              <Link className="font-medium hover:underline" href={`/opportunities/${encodeURIComponent(invoice.opportunityid)}`}>
                {invoice.opportunityname || invoice.opportunityid}
              </Link>
            ) : (
              <div className="font-medium">—</div>
            )}
            <div className="text-xs text-muted-foreground">{invoice.opportunityid || ""}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Quote</div>
            {invoice.quoteid ? (
              canViewQuote ? (
                <Link className="font-medium hover:underline" href={`/quotes/${encodeURIComponent(invoice.quoteid)}`}>
                  {invoice.quotetitle || invoice.quoteid}
                </Link>
              ) : (
                <div className="font-medium">{invoice.quotetitle || invoice.quoteid}</div>
              )
            ) : (
              <div className="font-medium">—</div>
            )}
            <div className="text-xs text-muted-foreground">{invoice.quoteid || ""}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Issued on</div>
            <div className="font-medium">{dates.issued}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Due on</div>
            <div className="font-medium">{dates.due}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Paid on</div>
            <div className="font-medium">{dates.paid}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Payment reference</div>
            <div className="font-medium">{invoice.payment_reference || "—"}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Created</div>
            <div className="font-medium">{dates.created}</div>
          </div>
        </CardContent>
      </Card>

      {invoice.line_items && invoice.line_items.length > 0 ? (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="font-headline">Line items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="overflow-hidden rounded-xl border">
              <div className="grid grid-cols-12 gap-2 border-b bg-muted/30 p-2 text-xs font-semibold text-muted-foreground">
                <div className="col-span-6">Description</div>
                <div className="col-span-2 text-right">Qty</div>
                <div className="col-span-2 text-right">Unit</div>
                <div className="col-span-1 text-right">Disc%</div>
                <div className="col-span-1 text-right">Total</div>
              </div>
              {invoice.line_items.map((it, idx) => {
                const qty = Math.max(0, Number(it.quantity ?? 0));
                const unit = Math.max(0, Number(it.unit_price ?? 0));
                const disc = Math.min(100, Math.max(0, Number(it.discount_percent ?? 0)));
                const line = qty * unit * (1 - disc / 100);
                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 border-b p-2 text-sm last:border-b-0">
                    <div className="col-span-6">{it.description}</div>
                    <div className="col-span-2 text-right">{qty}</div>
                    <div className="col-span-2 text-right">{formatMoney(unit, invoice.currency ?? "EUR")}</div>
                    <div className="col-span-1 text-right">{disc || 0}</div>
                    <div className="col-span-1 text-right">{formatMoney(line, invoice.currency ?? "EUR")}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card id="payments" className="rounded-2xl">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="font-headline">Payments</CardTitle>
            <CardDescription>Record partial or full payments linked to this invoice.</CardDescription>
          </div>
          <Button
            variant="accent"
            disabled={
              !ability.can("create", "Payment") ||
              invoice.status !== "Issued" ||
              Math.max(0, remainingDue) <= 0
            }
            onClick={() => setPaymentDialogOpen(true)}
          >
            Add payment
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {paymentsError ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {paymentsError}
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Paid</div>
              <div className="text-lg font-semibold">{formatMoney(paidSum, invoice.currency ?? "EUR")}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Remaining due</div>
              <div className="text-lg font-semibold">{formatMoney(Math.max(0, remainingDue), invoice.currency ?? "EUR")}</div>
            </div>
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Payments count</div>
              <div className="text-lg font-semibold">{payments.length}</div>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border">
            <div className="grid grid-cols-12 gap-2 border-b bg-muted/30 p-2 text-xs font-semibold text-muted-foreground">
              <div className="col-span-3">Payment</div>
              <div className="col-span-3">Paid on</div>
              <div className="col-span-2">Method</div>
              <div className="col-span-2 text-right">Amount</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>
            {paymentsLoading ? (
              <div className="p-3 text-sm text-muted-foreground">Loading payments…</div>
            ) : payments.length === 0 ? (
              <div className="p-3 text-sm text-muted-foreground">No payments yet.</div>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="grid grid-cols-12 gap-2 border-b p-2 text-sm last:border-b-0">
                  <div className="col-span-3 font-medium">{p.id}</div>
                  <div className="col-span-3">{fmtDate(p.paid_on)}</div>
                  <div className="col-span-2">{p.method}</div>
                  <div className="col-span-2 text-right">{formatMoney(p.amount, p.currency ?? invoice.currency ?? "EUR")}</div>
                  <div className="col-span-2 flex justify-end gap-2">
                    {ability.can("delete", "Payment") ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!confirm(`Delete payment ${p.id}?`)) return;
                          await deletePayment(p.id);
                          await load();
                        }}
                      >
                        Delete
                      </Button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-headline">Totals</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Total excl. tax</div>
            <div className="text-lg font-semibold">{formatMoney(invoice.total_excl_tax ?? 0, invoice.currency ?? "EUR")}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">VAT</div>
            <div className="text-lg font-semibold">{formatMoney(invoice.total_tax ?? 0, invoice.currency ?? "EUR")}</div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Total incl. tax</div>
            <div className="text-lg font-semibold">{formatMoney(invoice.total_incl_tax ?? 0, invoice.currency ?? "EUR")}</div>
          </div>
        </CardContent>
      </Card>

      <InvoiceDialog
        open={dialogOpen}
        onOpenChange={(o) => setDialogOpen(o)}
        invoice={invoice}
        customers={customers}
        opportunities={opportunities}
        onCreate={async () => {
          // Detail page doesn't create new invoices
          throw new Error("Not supported here");
        }}
        onUpdate={async (id, data) => onUpdate(id, data)}
      />

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        presetInvoiceId={invoice.id}
        currency={invoice.currency ?? "EUR"}
        maxAmount={Math.max(0, remainingDue)}
        onCreate={async (data) => {
          await createPayment(data as any);
          await reloadPayments();
          await load();
        }}
      />
    </div>
  );
}
