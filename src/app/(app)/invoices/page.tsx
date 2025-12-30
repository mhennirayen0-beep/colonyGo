"use client";

import { useState } from "react";
import { Download, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InvoicesTable } from "@/components/invoices/invoices-table";
import { InvoiceDialog } from "@/components/invoices/invoice-dialog";
import { useAbility } from "@/lib/ability";
import { useToast } from "@/hooks/use-toast";
import { useInvoices } from "@/hooks/use-invoices";
import { useCustomers } from "@/hooks/use-customers";
import { useOpportunitiesStore } from "@/lib/opportunities-store";
import { exportRowsAsCSV } from "@/lib/exporters";
import type { Invoice } from "@/lib/types";

export default function InvoicesPage() {
  const ability = useAbility();
  const { toast } = useToast();

  const { customers } = useCustomers();
  const { opportunities } = useOpportunitiesStore();

  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const limit = 20;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Invoice | null>(null);

  const { invoices, meta, loading, error, createInvoice, updateInvoice, deleteInvoice } = useInvoices({
    q: q.trim() || undefined,
    page,
    limit,
  });

  const handleNew = () => {
    if (!ability.can("create", "Invoice")) {
      toast({
        title: "Not allowed",
        description: "You do not have permission to create invoices.",
        variant: "destructive",
      });
      return;
    }
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (inv: Invoice) => {
    if (!ability.can("update", "Invoice")) {
      toast({
        title: "Not allowed",
        description: "You do not have permission to edit invoices.",
        variant: "destructive",
      });
      return;
    }
    setEditing(inv);
    setDialogOpen(true);
  };

  const handleDelete = async (invoice: Invoice) => {
    if (!ability.can("delete", "Invoice")) {
      toast({
        title: "Not allowed",
        description: "You do not have permission to delete invoices.",
        variant: "destructive",
      });
      return;
    }
    if (!confirm(`Delete invoice ${invoice.id}?`)) return;
    try {
      await deleteInvoice(invoice.id);
      toast({ title: "Deleted", description: `${invoice.id} deleted.` });
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e?.message ? String(e.message) : "Could not delete",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (invoice: Invoice, status: Invoice["status"]) => {
    if (!ability.can("update", "Invoice")) {
      toast({
        title: "Not allowed",
        description: "You do not have permission to update invoices.",
        variant: "destructive",
      });
      return;
    }
    if (status === "Cancelled") {
      if (!confirm(`Cancel invoice ${invoice.id}?`)) return;
    }
    try {
      await updateInvoice(invoice.id, { status } as any);
      toast({ title: "Updated", description: `${invoice.id} marked as ${status}.` });
    } catch (e: any) {
      toast({
        title: "Update failed",
        description: e?.message ? String(e.message) : "Could not change status",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary">Invoices</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              exportRowsAsCSV(
                invoices.map((inv) => ({
                  id: inv.id,
                  title: inv.title,
                  customer: inv.customername,
                  customerid: inv.customerid,
                  status: inv.status,
                  currency: inv.currency ?? "EUR",
                  total_incl_tax: inv.total_incl_tax ?? 0,
                  paid_total: inv.paid_total ?? 0,
                  remaining_due:
                    inv.remaining_due ?? Math.max(0, (inv.total_incl_tax ?? 0) - (inv.paid_total ?? 0)),
                  issued_on: inv.issued_on ?? "",
                  due_on: inv.due_on ?? "",
                })),
                `invoices_${new Date().toISOString().slice(0, 10)}.csv`,
              );
            }}
            disabled={loading || invoices.length === 0}
            title={invoices.length === 0 ? "No invoices to export" : "Export current list"}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>

          <Button onClick={handleNew} variant="accent" disabled={!ability.can("create", "Invoice")}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="max-w-md">
          <Input
            placeholder="Search invoices (id, title, customer…)"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
        </div>

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

      <InvoicesTable
        invoices={invoices}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />

      <InvoiceDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        invoice={editing}
        customers={customers}
        opportunities={opportunities}
        onCreate={createInvoice}
        onUpdate={updateInvoice}
      />
    </div>
  );
}
