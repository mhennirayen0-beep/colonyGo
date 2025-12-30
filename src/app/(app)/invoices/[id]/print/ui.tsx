"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";

import { api } from "@/lib/api-client";
import type { Invoice } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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

export function InvoicePrintClient({ invoiceId }: { invoiceId: string }) {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      issuedLabel: fmtDate(invoice?.issued_on || invoice?.createdAt),
      dueLabel: fmtDate(invoice?.due_on),
      paidLabel: fmtDate(invoice?.paid_on),
    };
  }, [invoice]);

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={load}>Retry</Button>
          <Button asChild variant="secondary">
            <Link href={`/invoices/${encodeURIComponent(invoiceId)}`}>Back</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!invoice) return null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 print:max-w-none">
      {/* Toolbar (hidden when printing) */}
      <div className="flex items-center justify-between print:hidden">
        <Button asChild variant="ghost">
          <Link href={`/invoices/${encodeURIComponent(invoice.id)}`}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Link>
        </Button>
        <Button onClick={() => window.print()} variant="accent">
          <Printer className="mr-2 h-4 w-4" /> Print
        </Button>
      </div>

      {/* Print content */}
      <Card className="rounded-2xl print:border-0 print:shadow-none">
        <CardContent className="p-6 print:p-0">
          <div className="flex items-start justify-between gap-6">
            <div>
              <div className="text-2xl font-headline font-bold">FACTURE</div>
              <div className="text-sm text-muted-foreground">Invoice #{invoice.id}</div>
              <div className="mt-2 text-sm">Date d’émission: <span className="font-medium">{dates.issuedLabel}</span></div>
              <div className="text-sm">Échéance: <span className="font-medium">{dates.dueLabel}</span></div>
              {invoice.status === "Paid" ? (
                <div className="text-sm">Payée le: <span className="font-medium">{dates.paidLabel}</span></div>
              ) : null}
              {invoice.payment_reference ? (
                <div className="text-sm">Référence paiement: <span className="font-medium">{invoice.payment_reference}</span></div>
              ) : null}
            </div>
            <div className="text-right">
              <div className="font-headline font-bold">ColonyGo</div>
              <div className="text-sm text-muted-foreground">France</div>
              <div className="text-xs text-muted-foreground">(Seller info to be configured)</div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-muted-foreground">Client</div>
              <div className="mt-1 font-medium">{invoice.customername || "—"}</div>
              <div className="text-xs text-muted-foreground">{invoice.customerid || ""}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground">Références</div>
              <div className="mt-1 text-sm">
                {invoice.quoteid ? (
                  <div>Devis: <span className="font-medium">{invoice.quoteid}</span></div>
                ) : null}
                {invoice.opportunityid ? (
                  <div>Opportunité: <span className="font-medium">{invoice.opportunityid}</span></div>
                ) : null}
                {!invoice.quoteid && !invoice.opportunityid ? <div className="text-muted-foreground">—</div> : null}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-xs font-semibold text-muted-foreground">Objet</div>
            <div className="mt-1 text-sm">{invoice.title}</div>
          </div>


          {invoice.line_items && invoice.line_items.length > 0 && (
            <div className="mt-8">
              <div className="text-xs font-semibold text-muted-foreground">Détails</div>
              <div className="mt-2 overflow-hidden rounded-xl border print:border-black/20">
                <div className="grid grid-cols-12 gap-2 border-b bg-muted/30 p-2 text-xs font-semibold text-muted-foreground print:bg-transparent">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2 text-right">Qté</div>
                  <div className="col-span-2 text-right">PU</div>
                  <div className="col-span-1 text-right">Rem%</div>
                  <div className="col-span-1 text-right">Total</div>
                </div>
                {invoice.line_items.map((it, idx) => {
                  const qty = Math.max(0, Number(it.quantity ?? 0));
                  const unit = Math.max(0, Number(it.unit_price ?? 0));
                  const disc = Math.min(100, Math.max(0, Number(it.discount_percent ?? 0)));
                  const line = qty * unit * (1 - disc / 100);
                  return (
                    <div key={idx} className="grid grid-cols-12 gap-2 border-b p-2 text-sm last:border-b-0 print:border-black/20">
                      <div className="col-span-6">{it.description}</div>
                      <div className="col-span-2 text-right">{qty}</div>
                      <div className="col-span-2 text-right">{formatMoney(unit, invoice.currency ?? "EUR")}</div>
                      <div className="col-span-1 text-right">{disc || 0}</div>
                      <div className="col-span-1 text-right">{formatMoney(line, invoice.currency ?? "EUR")}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Totals block (France-style) */}
          <div className="mt-8 flex justify-end">
            <div className="w-full max-w-sm space-y-2 rounded-xl border p-4 print:border-black/20">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total HT</span>
                <span className="font-medium">{formatMoney(invoice.total_excl_tax ?? 0, invoice.currency ?? "EUR")}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">TVA</span>
                <span className="font-medium">{formatMoney(invoice.total_tax ?? 0, invoice.currency ?? "EUR")}</span>
              </div>
              <div className="h-px bg-border print:bg-black/20" />
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total TTC</span>
                <span className="text-lg font-headline font-bold">{formatMoney(invoice.total_incl_tax ?? 0, invoice.currency ?? "EUR")}</span>
              </div>
            </div>
          </div>

          <div className="mt-10 text-xs text-muted-foreground">
            Ceci est une facture. Les mentions légales (SIRET, TVA intracom, conditions de règlement) seront ajoutées dans un prochain patch.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
