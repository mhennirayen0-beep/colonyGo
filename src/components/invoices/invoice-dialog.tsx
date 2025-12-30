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
import type { Customer, Invoice, Opportunity } from "@/lib/types";

const vatRates = [0, 5.5, 10, 20] as const;

const invoiceSchema = z.object({
  title: z.string().min(1, "Title is required"),
  customerid: z.string().min(1, "Customer is required"),
  opportunityid: z.string().optional(),
  currency: z.enum(["EUR", "USD", "GBP"]).default("EUR"),
  status: z.enum(["Draft", "Issued", "Paid", "Cancelled"]).default("Draft"),
  total_excl_tax: z.coerce.number().min(0, "Must be >= 0"),
  vat_rate: z.coerce
    .number()
    .refine((v) => vatRates.includes(v as any), "Invalid VAT"),
  issued_on: z.string().optional(), // YYYY-MM-DD
  due_on: z.string().optional(), // YYYY-MM-DD
  payment_reference: z.string().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

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

function round2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function bestVatRate(excl: number, tax: number): number {
  if (!excl || excl <= 0) return 20;
  const rate = (tax / excl) * 100;
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

function isoToDateInput(iso?: string) {
  if (!iso) return "";
  // Accept ISO and YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export function InvoiceDialog({
  open,
  onOpenChange,
  invoice,
  customers,
  opportunities,
  preset,
  onCreate,
  onUpdate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  customers: Customer[];
  opportunities: Opportunity[];
  preset?: Partial<Invoice> | null;
  onCreate: (data: Partial<Invoice>) => Promise<any>;
  onUpdate: (id: string, data: Partial<Invoice>) => Promise<any>;
}) {
  const { toast } = useToast();
  const ability = useAbility();

  const canSave = invoice ? ability.can("update", "Invoice") : ability.can("create", "Invoice");
  const canViewProducts = ability.can("view", "Product");
  const { products } = useProducts({ page: 1, limit: 100, enabled: canViewProducts });
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const [saving, setSaving] = useState(false);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: {
      title: "",
      customerid: "",
      opportunityid: "",
      currency: "EUR",
      status: "Draft",
      total_excl_tax: 0,
      vat_rate: 20,
      issued_on: "",
      due_on: "",
      payment_reference: "",
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
    const list = opportunities ?? [];
    if (!cid) return list;
    return list.filter((o) => o.customerid === cid);
  }, [opportunities, customerid]);

  const selectedOpp = useMemo(
    () => filteredOpps.find((o) => o.id === opportunityid),
    [filteredOpps, opportunityid],
  );

  const totals = useMemo(() => {
    const excl = Number(totalExcl ?? 0);
    const vat = Number(vatRate ?? 0);
    const tax = round2((excl * vat) / 100);
    const incl = round2(excl + tax);
    return { excl, tax, incl };
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

  const allowedStatuses = useMemo(() => {
    const current = (invoice?.status ?? (preset?.status as any) ?? 'Draft') as Invoice['status'];
    // For new invoices, keep it simple: Draft or Issued
    if (!invoice) return ['Draft', 'Issued'] as const;
    if (current === 'Draft') return ['Draft', 'Issued', 'Cancelled'] as const;
    if (current === 'Issued') return ['Issued', 'Paid', 'Cancelled'] as const;
    if (current === 'Paid') return ['Paid'] as const;
    if (current === 'Cancelled') return ['Cancelled'] as const;
    return ['Draft'] as const;
  }, [invoice?.id, invoice?.status, preset?.status]);

  // reset when opening / invoice changes / preset changes
  useEffect(() => {
    if (!open) return;
    const src: Partial<Invoice> = invoice ?? preset ?? {};

    form.reset({
      title: src.title ?? "",
      customerid: src.customerid ?? "",
      opportunityid: src.opportunityid ?? "",
      currency: (src.currency as any) ?? "EUR",
      status: (src.status as any) ?? "Draft",
      total_excl_tax: Number(src.total_excl_tax ?? 0),
      vat_rate:
        src.vat_rate !== undefined
          ? Number(src.vat_rate ?? 20)
          : bestVatRate(Number(src.total_excl_tax ?? 0), Number(src.total_tax ?? 0)),
      issued_on: isoToDateInput(src.issued_on),
      due_on: isoToDateInput(src.due_on),
      payment_reference: src.payment_reference ?? "",
    });

    setLineItems(normalizeLineItems((src as any).line_items));

    // If preset has a quote link, keep it in memory (we send it on submit)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, invoice?.id, preset?.quoteid]);

  // Auto-fill customer + currency when selecting opportunity
  useEffect(() => {
    if (!selectedOpp) return;
    const currentCustomer = form.getValues("customerid");
    if (!currentCustomer && selectedOpp.customerid) {
      form.setValue("customerid", selectedOpp.customerid);
    }
    if (selectedOpp.currency) {
      form.setValue("currency", (selectedOpp.currency as any) ?? "EUR");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedOpp?.id]);

  const onSubmit = async (values: InvoiceFormValues) => {
    if (!canSave) {
      toast({
        title: "Not allowed",
        description: "You do not have permission to save invoices.",
        variant: "destructive",
      });
      return;
    }

    const cid = values.customerid;
    const cust = customers.find((c) => c.id === cid);
    if (!cust) {
      toast({ title: "Customer required", description: "Please select a customer.", variant: "destructive" });
      return;
    }

    const opp = (values.opportunityid ?? "").trim()
      ? opportunities.find((o) => o.id === values.opportunityid)
      : undefined;

    const payload: Partial<Invoice> & { customername?: string; opportunityname?: string } = {
      title: values.title,
      customerid: values.customerid,
      customername: cust.name,
      opportunityid: values.opportunityid ? values.opportunityid : undefined,
      opportunityname: opp?.opportunityname,
      status: values.status as any,
      currency: values.currency,
      vat_rate: values.vat_rate,
      line_items: normalizeLineItems(lineItems),
      total_excl_tax: totals.excl,
      total_tax: totals.tax,
      total_incl_tax: totals.incl,
      issued_on: values.issued_on || undefined,
      due_on: values.due_on || undefined,
      payment_reference: values.payment_reference || undefined,
    };

    // carry quote linkage from invoice or preset
    const source = (invoice ?? preset ?? {}) as Partial<Invoice>;
    if (source.quoteid) payload.quoteid = source.quoteid;
    if (source.quotetitle) payload.quotetitle = source.quotetitle;

    try {
      setSaving(true);
      if (invoice) {
        await onUpdate(invoice.id, payload);
        toast({ title: "Updated", description: `${invoice.id} updated.` });
      } else {
        await onCreate(payload);
        toast({ title: "Created", description: "Invoice created." });
      }
      onOpenChange(false);
    } catch (e: any) {
      toast({
        title: "Save failed",
        description: e?.message ? String(e.message) : "Could not save invoice",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle className="font-headline">{invoice ? `Edit ${invoice.id}` : "New Invoice"}</DialogTitle>
          <DialogDescription>Facture — draft/issued/paid. VAT defaults to 20% (France).</DialogDescription>
        </DialogHeader>

        {!canSave ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            Not allowed: you don’t have permission to {invoice ? "update" : "create"} invoices.
          </div>
        ) : null}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Invoice title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={(v) => {
                        field.onChange(v);
                        // clear opportunity if customer changes
                        form.setValue("opportunityid", "");
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.name} ({c.id})
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
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={customer ? "Select opportunity" : "Select customer first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">— None —</SelectItem>
                        {filteredOpps.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.opportunityname} ({o.id})
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
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Currency</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
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
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {allowedStatuses.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              
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
                    <FormLabel>Total (excl. tax)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" readOnly={itemsHas} {...field} />
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
                    <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {vatRates.map((r) => (
                          <SelectItem key={String(r)} value={String(r)}>
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

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="issued_on"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Issued on</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="due_on"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due on</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_reference"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel>Payment reference (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. bank transfer reference" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* quick totals preview */}
            <div className="rounded-lg border bg-muted/30 p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">VAT</span>
                <span className="font-medium">{totals.tax.toFixed(2)}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                <span className="text-muted-foreground">Total (incl. tax)</span>
                <span className="text-base font-semibold">{totals.incl.toFixed(2)}</span>
              </div>
            </div>

            {/* source quote info (read-only) */}
            {(invoice?.quoteid || preset?.quoteid) ? (
              <div className="rounded-lg border p-3 text-sm">
                <div className="text-xs text-muted-foreground">Source quote</div>
                <div className="font-medium">{(invoice?.quoteid || preset?.quoteid) as string}</div>
                <div className="text-xs text-muted-foreground">{(invoice?.quotetitle || preset?.quotetitle) ?? ""}</div>
              </div>
            ) : null}

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="accent" disabled={!canSave || saving}>
                {saving ? "Saving…" : invoice ? "Save" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
