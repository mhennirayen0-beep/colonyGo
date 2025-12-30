"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Printer } from "lucide-react";

import { api } from "@/lib/api-client";
import type { Quote } from "@/lib/types";
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

export function QuotePrintClient({ quoteId }: { quoteId: string }) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const dates = useMemo(() => {
    const created = quote?.createdAt ? new Date(quote.createdAt) : null;
    const valid = quote?.valid_until ? new Date(quote.valid_until) : null;
    return {
      createdLabel: created ? created.toLocaleDateString("fr-FR") : "—",
      validLabel: valid ? valid.toLocaleDateString("fr-FR") : "—",
    };
  }, [quote]);

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
            <Link href={`/quotes/${encodeURIComponent(quoteId)}`}>Back</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (!quote) return null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4 print:max-w-none">
      {/* Toolbar (hidden when printing) */}
      <div className="flex items-center justify-between print:hidden">
        <Button asChild variant="ghost">
          <Link href={`/quotes/${encodeURIComponent(quote.id)}`}>
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
              <div className="text-2xl font-headline font-bold">DEVIS</div>
              <div className="text-sm text-muted-foreground">Quote #{quote.id}</div>
              <div className="mt-2 text-sm">Date: <span className="font-medium">{dates.createdLabel}</span></div>
              <div className="text-sm">Valable jusqu’au: <span className="font-medium">{dates.validLabel}</span></div>
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
              <div className="mt-1 font-medium">{quote.customername || "—"}</div>
              <div className="text-xs text-muted-foreground">{quote.customerid || ""}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-muted-foreground">Opportunité</div>
              <div className="mt-1 font-medium">{quote.opportunityname || "—"}</div>
              <div className="text-xs text-muted-foreground">{quote.opportunityid || ""}</div>
            </div>
          </div>

          <div className="mt-6">
            <div className="text-xs font-semibold text-muted-foreground">Objet</div>
            <div className="mt-1 text-sm">{quote.title}</div>
          </div>


          {quote.line_items && quote.line_items.length > 0 && (
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
                {quote.line_items.map((it, idx) => {
                  const qty = Math.max(0, Number(it.quantity ?? 0));
                  const unit = Math.max(0, Number(it.unit_price ?? 0));
                  const disc = Math.min(100, Math.max(0, Number(it.discount_percent ?? 0)));
                  const line = qty * unit * (1 - disc / 100);
                  return (
                    <div key={idx} className="grid grid-cols-12 gap-2 border-b p-2 text-sm last:border-b-0 print:border-black/20">
                      <div className="col-span-6">{it.description}</div>
                      <div className="col-span-2 text-right">{qty}</div>
                      <div className="col-span-2 text-right">{formatMoney(unit, quote.currency ?? "EUR")}</div>
                      <div className="col-span-1 text-right">{disc || 0}</div>
                      <div className="col-span-1 text-right">{formatMoney(line, quote.currency ?? "EUR")}</div>
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
                <span className="font-medium">{formatMoney(quote.total_excl_tax ?? 0, quote.currency ?? "EUR")}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">TVA</span>
                <span className="font-medium">{formatMoney(quote.total_tax ?? 0, quote.currency ?? "EUR")}</span>
              </div>
              <div className="h-px bg-border print:bg-black/20" />
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total TTC</span>
                <span className="text-lg font-headline font-bold">{formatMoney(quote.total_incl_tax ?? 0, quote.currency ?? "EUR")}</span>
              </div>
            </div>
          </div>

          <div className="mt-10 text-xs text-muted-foreground">
            Ceci est un devis. Les conditions commerciales/mentions légales seront ajoutées dans un prochain patch.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
