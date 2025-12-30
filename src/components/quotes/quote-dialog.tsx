"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/use-products";
import { useAbility } from "@/lib/ability";
import type { Customer, Opportunity, Quote } from "@/lib/types";

const vatRates = [0, 5.5, 10, 20] as const;

const quoteSchema = z.object({
  title: z.string().min(1, "Title is required"),
  customerid: z.string().min(1, "Customer is required"),
  opportunityid: z.string().optional(),
  currency: z.enum(["EUR", "USD", "GBP"]).default("EUR"),
  status: z.enum(["Draft", "Sent", "Accepted", "Rejected", "Expired"]).default("Draft"),
  total_excl_tax: z.coerce.number().min(0, "Must be >= 0"),
  vat_rate: z.coerce.number().refine((v) => vatRates.includes(v as any), "Invalid VAT"),
  valid_until: z.string().optional(), // YYYY-MM-DD
});

type QuoteFormValues = z.infer<typeof quoteSchema>;

type LocalLineItem = {
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  productid?: string;
};

function normalizeLineItems(items: any): LocalLineItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => ({
      description: String(it?.description ?? ""),
      quantity: Number(it?.quantity ?? 0),
      unit_price: Number(it?.unit_price ?? 0),
      discount_percent: Number(it?.discount_percent ?? 0),
      productid: it?.productid ? String(it.productid) : undefined,
    }))
    .filter((it) => it.description.trim().length > 0);
}

function computeItemsSubtotal(items: LocalLineItem[]) {
  return round2(
    items.reduce((acc, it) => {
      const qty = Math.max(0, Number(it.quantity ?? 0));
      const unit = Math.max(0, Number(it.unit_price ?? 0));
      const disc = Math.min(100, Math.max(0, Number(it.discount_percent ?? 0)));
      return acc + qty * unit * (1 - disc / 100);
    }, 0),
  );
}

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
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

function bestVatRate(excl: number, tax: number): number {
  if (!excl || excl <= 0) return 20;
  const rate = (tax / excl) * 100;
  // pick closest from our list
  let best = 20;
  let bestDist = Infinity;
  for (const r of vatRates) {
    const d = Math.abs(rate - r);
    if (d < bestDist) {
      bestDist = d;
      best = r;
    }
  }
  return best;
}

export function QuoteDialog({
  open,
  onOpenChange,
  quote,
  customers,
  opportunities,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote | null;
  customers: Customer[];
  opportunities: Opportunity[];
  onCreate: (data: Partial<Quote>) => Promise<any>;
  onUpdate: (id: string, data: Partial<Quote>) => Promise<any>;
}) {
  const { toast } = useToast();
  const ability = useAbility();
  const canSave = quote ? ability.can("update", "Quote") : ability.can("create", "Quote");
  const canViewProducts = ability.can("view", "Product");

  const { products } = useProducts({ page: 1, limit: 100, enabled: canViewProducts });
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);

  const [saving, setSaving] = useState(false);

  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      title: "",
      customerid: "",
      opportunityid: "",
      currency: "EUR",
      status: "Draft",
      total_excl_tax: 0,
      vat_rate: 20,
      valid_until: "",
    },
  });
  const [lineItems, setLineItems] = useState<LocalLineItem[]>([]);


  const customerid = form.watch("customerid");
  const opportunityid = form.watch("opportunityid");
  const currency = form.watch("currency");
  const totalExcl = form.watch("total_excl_tax");
  const vatRate = form.watch("vat_rate");

  const customer = useMemo(
    () => customers.find((c) => c.id === customerid),
    [customers, customerid],
  );

  const filteredOpps = useMemo(() => {
    const cid = (customerid ?? "").trim();
    if (!cid) return opportunities;
    return opportunities.filter((o) => String(o.customerid) === cid);
  }, [opportunities, customerid]);

  const totals = useMemo(() => {
    const excl = Number.isFinite(totalExcl) ? Number(totalExcl) : 0;
    const rate = Number.isFinite(vatRate) ? Number(vatRate) : 0;
    const tax = round2((excl * rate) / 100);
    const incl = round2(excl + tax);
    return { excl: round2(excl), tax, incl };
  }, [totalExcl, vatRate]);

  const itemsSubtotal = useMemo(() => computeItemsSubtotal(lineItems), [lineItems]);
  const itemsHas = useMemo(() => lineItems.some((it) => it.description.trim().length > 0), [lineItems]);

  // If line items are present, keep Total (excl. tax) in sync with items subtotal.
  useEffect(() => {
    if (!open) return;
    if (!itemsHas) return;
    const current = Number(form.getValues("total_excl_tax") ?? 0);
    if (Math.abs(current - itemsSubtotal) > 0.009) {
      form.setValue("total_excl_tax", itemsSubtotal, { shouldDirty: true, shouldValidate: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsSubtotal, itemsHas, open]);

  useEffect(() => {
    if (!open) return;
    if (quote) {
      const excl = Number(quote.total_excl_tax ?? 0);
      const tax = Number(quote.total_tax ?? 0);
      const validUntil = quote.valid_until ? String(quote.valid_until).slice(0, 10) : "";
      form.reset({
        title: quote.title,
        customerid: quote.customerid,
        opportunityid: quote.opportunityid ?? "",
        currency: (quote.currency as any) || "EUR",
        status: (quote.status as any) || "Draft",
        total_excl_tax: excl,
        vat_rate:
          quote.vat_rate !== undefined
            ? Number(quote.vat_rate ?? 20)
            : bestVatRate(excl, tax),
        valid_until: validUntil,
      });

      setLineItems(normalizeLineItems((quote as any).line_items));
    } else {
      form.reset({
        title: "",
        customerid: "",
        opportunityid: "",
        currency: "EUR",
        status: "Draft",
        total_excl_tax: 0,
        vat_rate: 20,
        valid_until: "",
      });

      setLineItems([]);
    }
  }, [open, quote, form]);

  // If an opportunity is selected, auto-fill customer & currency.
  useEffect(() => {
    if (!open) return;
    const oid = (opportunityid ?? "").trim();
    if (!oid) return;
    const opp = opportunities.find((o) => o.id === oid);
    if (!opp) return;

    if (opp.customerid && opp.customerid !== form.getValues("customerid")) {
      form.setValue("customerid", String(opp.customerid), { shouldDirty: true, shouldValidate: true });
    }
    if (opp.currency) {
      form.setValue("currency", (opp.currency as any) || "EUR", { shouldDirty: true });
    }
    const title = form.getValues("title");
    if (!title || title.trim().length === 0) {
      form.setValue("title", `Devis - ${opp.opportunityname}`, { shouldDirty: true });
    }
  }, [open, opportunityid, opportunities, form]);

  // If customer changes and selected opportunity doesn't match anymore, clear it.
  useEffect(() => {
    if (!open) return;
    const oid = (form.getValues("opportunityid") ?? "").trim();
    if (!oid) return;
    const opp = opportunities.find((o) => o.id === oid);
    if (opp && String(opp.customerid) !== String(form.getValues("customerid"))) {
      form.setValue("opportunityid", "", { shouldDirty: true });
    }
  }, [open, customerid, opportunities, form]);

  const submit = async (values: QuoteFormValues) => {
    if (!canSave) {
      toast({
        title: "Not allowed",
        description: "You do not have permission to save quotes.",
        variant: "destructive",
      });
      return;
    }

    const cust = customers.find((c) => c.id === values.customerid);
    if (!cust) {
      toast({ title: "Missing customer", description: "Please select a customer.", variant: "destructive" });
      return;
    }

    const oid = (values.opportunityid ?? "").trim();
    const opp = oid ? opportunities.find((o) => o.id === oid) : undefined;
    const payload: Partial<Quote> = {
      title: values.title,
      customerid: values.customerid,
      customername: cust.name,
      opportunityid: oid || undefined,
      opportunityname: opp?.opportunityname,
      status: values.status,
      currency: values.currency,
      vat_rate: values.vat_rate,
      line_items: normalizeLineItems(lineItems),
      total_excl_tax: totals.excl,
      total_tax: totals.tax,
      total_incl_tax: totals.incl,
      valid_until: values.valid_until ? new Date(values.valid_until).toISOString() : undefined,
    };

    try {
      setSaving(true);
      if (quote) {
        await onUpdate(quote.id, payload);
        toast({ title: "Quote updated", description: `${quote.id} saved successfully.` });
      } else {
        await onCreate(payload);
        toast({ title: "Quote created", description: "New quote created successfully." });
      }
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.message ? String(e.message) : "Could not save quote",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{quote ? `Edit Quote ${quote.id}` : "New Quote"}</DialogTitle>
          <DialogDescription>
            Devis — choose customer, optional opportunity, currency and totals.
          </DialogDescription>
        </DialogHeader>

        {!canSave ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            You do not have permission to {quote ? "edit" : "create"} quotes.
          </div>
        ) : null}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Devis - Migration CRM" {...field} disabled={saving || !canSave} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="customerid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={saving || !canSave}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="opportunityid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opportunity (optional)</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                      disabled={saving || !canSave || filteredOpps.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={customer ? "Select opportunity" : "Select customer first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">No opportunity</SelectItem>
                        {filteredOpps.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.opportunityname}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={saving || !canSave}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Currency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange} disabled={saving || !canSave}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Sent">Sent</SelectItem>
                        <SelectItem value="Accepted">Accepted</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value="Expired">Expired</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valid_until"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid until</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} disabled={saving || !canSave} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">Line items (optional)</div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setLineItems((prev) => [
                      ...prev,
                      { description: "", quantity: 1, unit_price: 0, discount_percent: 0 },
                    ])
                  }
                >
                  Add line
                </Button>
              </div>

              {lineItems.length === 0 ? (
                <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
                  No line items yet. You can keep using manual totals, or add lines and the total HT will be computed.
                </div>
              ) : (
                <div className="rounded-lg border">
                  <div className="grid grid-cols-12 gap-2 border-b bg-muted/30 p-2 text-xs font-semibold text-muted-foreground">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2 text-right">Qty</div>
                    <div className="col-span-2 text-right">Unit</div>
                    <div className="col-span-1 text-right">Disc%</div>
                    <div className="col-span-1 text-right"> </div>
                  </div>

                  {lineItems.map((it, idx) => {
                    const lineTotal = round2(
                      Math.max(0, it.quantity) *
                        Math.max(0, it.unit_price) *
                        (1 - Math.min(100, Math.max(0, it.discount_percent)) / 100),
                    );
                    return (
                      <div key={idx} className="grid grid-cols-12 gap-2 p-2 text-sm">
                        <div className="col-span-6">
                          <div className="space-y-2">
                            {canViewProducts ? (
                              <Select
                                value={it.productid ?? ""}
                                onValueChange={(val) => {
                                  setLineItems((prev) =>
                                    prev.map((x, i) => {
                                      if (i !== idx) return x;
                                      const v = String(val ?? "");
                                      if (!v) return { ...x, productid: undefined };
                                      const p = productById.get(v);
                                      if (!p) return { ...x, productid: v };
                                      return {
                                        ...x,
                                        productid: v,
                                        description: p.name,
                                        unit_price: Number(p.price ?? 0),
                                      };
                                    }),
                                  );
                                }}
                                disabled={saving || !canSave}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Product (optional)" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="">Custom</SelectItem>
                                  {products.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                      {p.name} — {formatMoney(Number(p.price ?? 0), currency ?? "EUR")}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : null}

                            <Input
                              value={it.description}
                              onChange={(e) =>
                                setLineItems((prev) =>
                                  prev.map((x, i) =>
                                    i === idx
                                      ? { ...x, description: e.target.value, productid: x.productid }
                                      : x,
                                  ),
                                )
                              }
                              placeholder="Item / service"
                            />
                          </div>
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={it.quantity}
                            onChange={(e) =>
                              setLineItems((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, quantity: Number(e.target.value || 0) } : x,
                                ),
                              )
                            }
                          />
                        </div>
                        <div className="col-span-2">
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={it.unit_price}
                            onChange={(e) =>
                              setLineItems((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, unit_price: Number(e.target.value || 0) } : x,
                                ),
                              )
                            }
                          />
                        </div>
                        <div className="col-span-1">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            value={it.discount_percent}
                            onChange={(e) =>
                              setLineItems((prev) =>
                                prev.map((x, i) =>
                                  i === idx ? { ...x, discount_percent: Number(e.target.value || 0) } : x,
                                ),
                              )
                            }
                          />
                        </div>
                        <div className="col-span-1 flex items-center justify-end gap-2">
                          <div className="hidden text-xs text-muted-foreground sm:block">
                            {formatMoney(lineTotal, form.getValues("currency") ?? "EUR")}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setLineItems((prev) => prev.filter((_, i) => i !== idx))}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex items-center justify-end gap-3 border-t bg-muted/30 p-2 text-sm">
                    <span className="text-muted-foreground">Subtotal (HT):</span>
                    <span className="font-medium">{formatMoney(itemsSubtotal, form.getValues("currency") ?? "EUR")}</span>
                  </div>
                </div>
              )}
            </div>

<FormField
                control={form.control}
                name="total_excl_tax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total excl. tax</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min={0} {...field} disabled={saving || !canSave} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vat_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VAT rate</FormLabel>
                    <Select
                      value={String(field.value)}
                      onValueChange={(v) => field.onChange(Number(v))}
                      disabled={saving || !canSave}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="VAT" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vatRates.map((r) => (
                          <SelectItem key={r} value={String(r)}>
                            {r}%
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 gap-2 rounded-lg border bg-muted/30 p-3 text-sm md:grid-cols-3">
              <div>
                <div className="text-muted-foreground">Excl. tax</div>
                <div className="font-medium">{totals.excl}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Tax</div>
                <div className="font-medium">{totals.tax}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Incl. tax</div>
                <div className="font-semibold">{totals.incl}</div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" disabled={saving || !canSave}>
                {saving ? "Saving…" : "Save"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
