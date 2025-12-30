"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Printer, Pencil, Receipt, Send, CheckCircle2, XCircle, Clock } from "lucide-react";

import { api } from "@/lib/api-client";
import { useAbility } from "@/lib/ability";
import { useToast } from "@/hooks/use-toast";
import { useCustomers } from "@/hooks/use-customers";
import { useOpportunitiesStore } from "@/lib/opportunities-store";
import type { Invoice, Quote } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuoteDialog } from "@/components/quotes/quote-dialog";
import { InvoiceDialog } from "@/components/invoices/invoice-dialog";

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

function mapQuote(doc: any): Quote {
  return {
    id: String(doc?.quoteId ?? doc?.id ?? ""),
    title: String(doc?.title ?? ""),
    customerid: String(doc?.customerid ?? ""),
    customername: String(doc?.customername ?? ""),
    opportunityid: doc?.opportunityid ? String(doc.opportunityid) : undefined,
    opportunityname: doc?.opportunityname ? String(doc.opportunityname) : undefined,
    status: (doc?.status ?? "Draft") as any,
    currency: String(doc?.currency ?? "EUR"),
    vat_rate: doc?.vat_rate !== undefined ? Number(doc.vat_rate) : undefined,
    line_items: Array.isArray(doc?.line_items)
      ? doc.line_items.map((it: any) => ({
          description: String(it?.description ?? ""),
          quantity: Number(it?.quantity ?? 0),
          unit_price: Number(it?.unit_price ?? 0),
          discount_percent: Number(it?.discount_percent ?? 0),
          productid: it?.productid ? String(it.productid) : undefined,
        }))
      : undefined,
    total_excl_tax: Number(doc?.total_excl_tax ?? 0),
    total_tax: Number(doc?.total_tax ?? 0),
    total_incl_tax: Number(doc?.total_incl_tax ?? 0),
    valid_until: doc?.valid_until ? String(doc.valid_until) : undefined,
    sent_on: doc?.sent_on ? String(doc.sent_on) : undefined,
    accepted_on: doc?.accepted_on ? String(doc.accepted_on) : undefined,
    rejected_on: doc?.rejected_on ? String(doc.rejected_on) : undefined,
    expired_on: doc?.expired_on ? String(doc.expired_on) : undefined,
    createdAt: doc?.createdAt ? String(doc.createdAt) : undefined,
    updatedAt: doc?.updatedAt ? String(doc.updatedAt) : undefined,
  };
}

export function QuoteDetailClient({ quoteId }: { quoteId: string }) {
  const ability = useAbility();
  const { toast } = useToast();
  const { customers } = useCustomers();
  const { opportunities } = useOpportunitiesStore();

  const canViewInvoices = ability.can("view", "Invoice");
  const canEdit = ability.can("update", "Quote");
  const canCreateInvoice = ability.can("create", "Invoice");

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [invoicePreset, setInvoicePreset] = useState<Partial<Invoice> | null>(null);

  // Linked invoices list (Quote → Invoices)
  const [linkedInvoices, setLinkedInvoices] = useState<Invoice[]>([]);
  const [linkedLoading, setLinkedLoading] = useState(false);
  const [linkedError, setLinkedError] = useState<string | null>(null);

  const canStatusChange = canEdit;

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<any>(`/quotes/${encodeURIComponent(quoteId)}`);
      setQuote(mapQuote(res));
    } catch (e: any) {
      setError(e?.message ? String(e.message) : "Failed to load quote");
      setQuote(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteId]);

  useEffect(() => {
    const qid = quote?.id?.trim();
    if (!qid) return;
    if (!canViewInvoices) return;

    let cancelled = false;
    (async () => {
      setLinkedLoading(true);
      setLinkedError(null);
      try {
        const params = new URLSearchParams();
        params.set("quoteid", qid);
        params.set("limit", "20");
        const res = await api.get<any>(`/invoices?${params.toString()}`);
        const items = Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
              ? res
              : [];
        if (!cancelled) setLinkedInvoices(items.map(mapInvoice));
      } catch (e: any) {
        if (!cancelled) {
          setLinkedError(e?.message ? String(e.message) : "Failed to load linked invoices");
          setLinkedInvoices([]);
        }
      } finally {
        if (!cancelled) setLinkedLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [quote?.id, canViewInvoices]);

  const openInvoiceFromQuote = () => {
    if (!canCreateInvoice) {
      toast({
        title: "Not allowed",
        description: "You do not have permission to create invoices.",
        variant: "destructive",
      });
      return;
    }
    if (!quote) return;

    // Business rule: invoice should be created from an accepted quote
    if (quote.status !== "Accepted") {
      toast({
        title: "Quote not accepted",
        description: "You can create an invoice only when the quote is Accepted.",
        variant: "destructive",
      });
      return;
    }

    const today = new Date();
    const due = new Date(today);
    due.setDate(due.getDate() + 30);
    const toDate = (d: Date) => d.toISOString().slice(0, 10);

    setInvoicePreset({
      title: `Invoice - ${quote.title}`,
      customerid: quote.customerid,
      customername: quote.customername,
      opportunityid: quote.opportunityid,
      opportunityname: quote.opportunityname,
      quoteid: quote.id,
      quotetitle: quote.title,
      status: "Draft",
      currency: quote.currency ?? "EUR",
      vat_rate: quote.vat_rate ?? 20,
      line_items: Array.isArray(quote.line_items) ? quote.line_items : [],
      total_excl_tax: quote.total_excl_tax ?? 0,
      total_tax: quote.total_tax ?? 0,
      total_incl_tax: quote.total_incl_tax ?? 0,
      issued_on: toDate(today),
      due_on: toDate(due),
    });
    setInvoiceOpen(true);
  };

  const setQuoteStatus = async (next: Quote["status"]) => {
    if (!quote) return;
    if (!canStatusChange) {
      toast({ title: "Not allowed", description: "You do not have permission to update quotes.", variant: "destructive" });
      return;
    }
    try {
      const updated = await api.patch<any>(`/quotes/${encodeURIComponent(quote.id)}`, { status: next });
      setQuote(mapQuote(updated));
      toast({ title: "Status updated", description: `${quote.id} → ${next}` });
    } catch (e: any) {
      toast({ title: "Update failed", description: e?.message ? String(e.message) : "Could not update status", variant: "destructive" });
    }
  };

  // allow "Create invoice" deep-link from quotes table without using searchParams
  useEffect(() => {
    if (!quote) return;
    if (typeof window === "undefined") return;
    if (window.location.hash === "#create-invoice") {
      openInvoiceFromQuote();
      // clean hash so refresh doesn't reopen
      try {
        history.replaceState(null, "", window.location.pathname);
      } catch {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote?.id]);

  const dates = useMemo(() => {
    const created = quote?.createdAt ? new Date(quote.createdAt) : null;
    const valid = quote?.valid_until ? new Date(quote.valid_until) : null;
    const sent = quote?.sent_on ? new Date(quote.sent_on) : null;
    const accepted = quote?.accepted_on ? new Date(quote.accepted_on) : null;
    return {
      createdLabel: created ? created.toLocaleDateString("fr-FR") : "—",
      validLabel: valid ? valid.toLocaleDateString("fr-FR") : "—",
      sentLabel: sent ? sent.toLocaleDateString("fr-FR") : "—",
      acceptedLabel: accepted ? accepted.toLocaleDateString("fr-FR") : "—",
    };
  }, [quote]);

  const statusActions = useMemo(() => {
    const s = quote?.status;
    const isDraft = s === "Draft";
    const isSent = s === "Sent";
    return {
      canMarkSent: isDraft,
      canAccept: isDraft || isSent,
      canReject: isDraft || isSent,
      canExpire: isDraft || isSent,
    };
  }, [quote?.status]);

  const onUpdate = async (id: string, data: Partial<Quote>) => {
    const updated = await api.patch<any>(`/quotes/${encodeURIComponent(id)}`, data);
    setQuote(mapQuote(updated));
  };

  const setStatus = async (next: Quote["status"]) => {
    if (!quote) return;
    if (!canStatusChange) {
      toast({ title: "Not allowed", description: "You do not have permission to update quotes.", variant: "destructive" });
      return;
    }
    try {
      const updated = await api.patch<any>(`/quotes/${encodeURIComponent(quote.id)}`, { status: next });
      setQuote(mapQuote(updated));
      toast({ title: "Quote updated", description: `Status set to ${next}` });
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e?.message ? String(e.message) : "Unable to change quote status",
        variant: "destructive",
      });
    }
  };

  const createInvoiceFromQuote = async (data: Partial<Invoice>) => {
    const created = await api.post<any>("/invoices", data);
    // best effort: show toast + go to invoices list filtered
    toast({ title: "Invoice created", description: `Created ${created?.id ?? created?.invoiceId ?? ""}` });
  };

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-headline">Quote</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Loading…</CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle className="font-headline">Quote</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={load}>Retry</Button>
            <Button asChild variant="secondary">
              <Link href="/quotes">Back to Quotes</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quote) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" aria-label="Back">
            <Link href="/quotes">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-headline font-bold text-primary">{quote.id}</h1>
              <Badge variant="secondary">{quote.status}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">{quote.title}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quote workflow actions */}
          {statusActions.canMarkSent ? (
            <Button variant="outline" disabled={!canStatusChange} onClick={() => setStatus("Sent")}>
              <Send className="mr-2 h-4 w-4" /> Mark sent
            </Button>
          ) : null}

          {statusActions.canAccept || statusActions.canReject || statusActions.canExpire ? (
            <>
              {statusActions.canAccept ? (
                <Button variant="outline" disabled={!canStatusChange} onClick={() => setStatus("Accepted")}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Accept
                </Button>
              ) : null}
              {statusActions.canReject ? (
                <Button variant="outline" disabled={!canStatusChange} onClick={() => setStatus("Rejected")}>
                  <XCircle className="mr-2 h-4 w-4" /> Reject
                </Button>
              ) : null}
              {statusActions.canExpire ? (
                <Button variant="outline" disabled={!canStatusChange} onClick={() => setStatus("Expired")}>
                  <Clock className="mr-2 h-4 w-4" /> Expire
                </Button>
              ) : null}
            </>
          ) : null}

          <Button asChild variant="outline">
            <Link href={`/quotes/${encodeURIComponent(quote.id)}/print`}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Link>
          </Button>
          <Button
            variant="secondary"
            disabled={!canCreateInvoice || quote.status !== "Accepted"}
            onClick={openInvoiceFromQuote}
          >
            <Receipt className="mr-2 h-4 w-4" /> Create invoice
          </Button>
          <Button
            variant="accent"
            disabled={!canEdit}
            onClick={() => {
              if (!canEdit) {
                toast({ title: "Not allowed", description: "You do not have permission to edit quotes.", variant: "destructive" });
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
            <div className="font-medium">{quote.customername || "—"}</div>
            <div className="text-xs text-muted-foreground">{quote.customerid || ""}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Opportunity</div>
            <div className="font-medium">{quote.opportunityname || "—"}</div>
            <div className="text-xs text-muted-foreground">{quote.opportunityid || ""}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Created</div>
            <div className="font-medium">{dates.createdLabel}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Valid until</div>
            <div className="font-medium">{dates.validLabel}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Sent</div>
            <div className="font-medium">{quote.sent_on ? dates.sentLabel : "—"}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Accepted</div>
            <div className="font-medium">{quote.accepted_on ? dates.acceptedLabel : "—"}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Total (excl. tax)</div>
            <div className="font-medium">{formatMoney(quote.total_excl_tax ?? 0, quote.currency ?? "EUR")}</div>
          </div>

          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">VAT</div>
            <div className="font-medium">{formatMoney(quote.total_tax ?? 0, quote.currency ?? "EUR")}</div>
          </div>

          <div className="space-y-1 sm:col-span-2">
            <div className="text-xs text-muted-foreground">Total (incl. tax)</div>
            <div className="text-2xl font-headline font-bold">
              {formatMoney(quote.total_incl_tax ?? 0, quote.currency ?? "EUR")}
            </div>
          </div>
        </CardContent>
      </Card>

      {quote.line_items && quote.line_items.length > 0 ? (
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
              {quote.line_items.map((it, idx) => {
                const qty = Math.max(0, Number(it.quantity ?? 0));
                const unit = Math.max(0, Number(it.unit_price ?? 0));
                const disc = Math.min(100, Math.max(0, Number(it.discount_percent ?? 0)));
                const line = qty * unit * (1 - disc / 100);
                return (
                  <div key={idx} className="grid grid-cols-12 gap-2 border-b p-2 text-sm last:border-b-0">
                    <div className="col-span-6">{it.description}</div>
                    <div className="col-span-2 text-right">{qty}</div>
                    <div className="col-span-2 text-right">{formatMoney(unit, quote.currency ?? "EUR")}</div>
                    <div className="col-span-1 text-right">{disc || 0}</div>
                    <div className="col-span-1 text-right">{formatMoney(line, quote.currency ?? "EUR")}</div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {canViewInvoices ? (
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="font-headline">Invoices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {linkedLoading ? (
              <div className="text-sm text-muted-foreground">Loading invoices…</div>
            ) : linkedError ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                {linkedError}
              </div>
            ) : linkedInvoices.length === 0 ? (
              <div className="text-sm text-muted-foreground">No invoices linked to this quote yet.</div>
            ) : (
              <div className="space-y-2">
                {linkedInvoices.map((inv) => (
                  <div key={inv.id} className="flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Link className="font-semibold hover:underline" href={`/invoices/${encodeURIComponent(inv.id)}`}>
                          {inv.id}
                        </Link>
                        <Badge variant="secondary">{inv.status}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{inv.title}</div>
                    </div>
                    <div className="flex flex-col items-start gap-2 sm:items-end">
                      <div className="font-semibold">{formatMoney(inv.total_incl_tax ?? 0, inv.currency ?? "EUR")}</div>
                      <div className="flex gap-2">
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/invoices/${encodeURIComponent(inv.id)}`}>View</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <Link href={`/invoices/${encodeURIComponent(inv.id)}/print`}>Print</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      <QuoteDialog
        open={dialogOpen}
        onOpenChange={(o) => setDialogOpen(o)}
        quote={quote}
        customers={customers}
        opportunities={opportunities}
        onCreate={async () => {
          throw new Error("Create is not supported from detail");
        }}
        onUpdate={onUpdate}
      />

      <InvoiceDialog
        open={invoiceOpen}
        onOpenChange={(o) => {
          setInvoiceOpen(o);
          if (!o) setInvoicePreset(null);
        }}
        invoice={null}
        preset={invoicePreset}
        customers={customers}
        opportunities={opportunities}
        onCreate={createInvoiceFromQuote}
        onUpdate={async () => {
          throw new Error("Update is not supported from quote detail");
        }}
      />
    </div>
  );
}
