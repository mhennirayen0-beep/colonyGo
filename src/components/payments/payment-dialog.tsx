"use client";

import { useEffect, useMemo, useState } from "react";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { Payment } from "@/lib/types";

const METHOD_OPTIONS: { value: Payment["method"]; label: string }[] = [
  { value: "Transfer", label: "Virement" },
  { value: "Card", label: "Carte" },
  { value: "Cash", label: "Espèces" },
  { value: "Check", label: "Chèque" },
  { value: "Other", label: "Autre" },
];

function toDateInputValue(iso?: string) {
  const d = iso ? new Date(iso) : new Date();
  if (Number.isNaN(d.getTime())) return "";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function PaymentDialog({
  open,
  onOpenChange,
  presetInvoiceId,
  currency,
  maxAmount,
  onCreate,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  presetInvoiceId?: string;
  currency?: string;
  /** Optional cap (ex: remaining due). When provided, amount must be <= maxAmount (allowing 0.01 rounding). */
  maxAmount?: number;
  onCreate: (data: { invoiceid: string; amount: number; method: Payment["method"]; paid_on?: string; reference?: string; note?: string }) => Promise<any>;
}) {
  const [invoiceid, setInvoiceid] = useState(presetInvoiceId ?? "");
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<Payment["method"]>("Transfer");
  const [paidOn, setPaidOn] = useState<string>(toDateInputValue());
  const [reference, setReference] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setInvoiceid(presetInvoiceId ?? "");
    setAmount("");
    setMethod("Transfer");
    setPaidOn(toDateInputValue());
    setReference("");
    setNote("");
  }, [open, presetInvoiceId]);

  const amountNumber = useMemo(() => {
    const n = Number(String(amount).replace(",", "."));
    return Number.isFinite(n) ? n : NaN;
  }, [amount]);

  const maxAllowed = useMemo(() => {
    if (maxAmount == null) return null;
    const n = Number(maxAmount);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return n;
  }, [maxAmount]);

  const exceedsMax = useMemo(() => {
    if (maxAllowed == null) return false;
    if (!Number.isFinite(amountNumber)) return false;
    // allow tiny rounding difference
    return amountNumber > maxAllowed + 0.01;
  }, [amountNumber, maxAllowed]);

  const canSubmit =
    invoiceid.trim().length > 0 &&
    Number.isFinite(amountNumber) &&
    amountNumber > 0 &&
    !exceedsMax;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-headline">Add Payment</DialogTitle>
          <DialogDescription>Record a payment linked to an invoice (supports partial payments).</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="invoiceid">Invoice ID</Label>
            <Input
              id="invoiceid"
              placeholder="INV-000123"
              value={invoiceid}
              onChange={(e) => setInvoiceid(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="amount">Amount{currency ? ` (${currency})` : ""}</Label>
              <Input
                id="amount"
                inputMode="decimal"
                placeholder="100.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              {maxAllowed != null ? (
                <div className={`text-xs ${exceedsMax ? "text-destructive" : "text-muted-foreground"}`}>
                  Max allowed: {maxAllowed.toFixed(2)}{currency ? ` ${currency}` : ""}
                </div>
              ) : null}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="paid_on">Paid on</Label>
              <Input
                id="paid_on"
                type="date"
                value={paidOn}
                onChange={(e) => setPaidOn(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  {METHOD_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reference">Reference</Label>
              <Input
                id="reference"
                placeholder="Bank transfer ref..."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="note">Note</Label>
            <Input id="note" placeholder="Optional note" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="accent"
            disabled={!canSubmit || submitting}
            onClick={async () => {
              if (!canSubmit) return;
              setSubmitting(true);
              try {
                await onCreate({
                  invoiceid: invoiceid.trim(),
                  amount: amountNumber,
                  method,
                  paid_on: paidOn ? new Date(paidOn).toISOString() : undefined,
                  reference: reference.trim() || undefined,
                  note: note.trim() || undefined,
                });
                onOpenChange(false);
              } finally {
                setSubmitting(false);
              }
            }}
          >
            Add Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
