"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { QuotesTable } from "@/components/quotes/quotes-table";
import { QuoteDialog } from "@/components/quotes/quote-dialog";
import { useAbility } from "@/lib/ability";
import { useToast } from "@/hooks/use-toast";
import { useQuotes } from "@/hooks/use-quotes";
import { useCustomers } from "@/hooks/use-customers";
import { useOpportunitiesStore } from "@/lib/opportunities-store";
import type { Quote } from "@/lib/types";

export default function QuotesPage() {
  const ability = useAbility();
  const { toast } = useToast();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Quote | null>(null);

  const { customers } = useCustomers();
  const { opportunities } = useOpportunitiesStore();

  const { quotes, meta, loading, error, createQuote, updateQuote, deleteQuote } = useQuotes({
    q: q.trim() || undefined,
    page,
    limit,
  });

  const handleNew = () => {
    if (!ability.can('create', 'Quote')) {
      toast({
        title: 'Not allowed',
        description: 'You do not have permission to create quotes.',
        variant: 'destructive',
      });
      return;
    }
    setEditing(null);
    setDialogOpen(true);
  };

  const handleEdit = (quote: Quote) => {
    if (!ability.can('update', 'Quote')) {
      toast({ title: 'Not allowed', description: 'You do not have permission to edit quotes.', variant: 'destructive' });
      return;
    }
    setEditing(quote);
    setDialogOpen(true);
  };

  const handleDelete = async (quote: Quote) => {
    if (!ability.can('delete', 'Quote')) {
      toast({ title: 'Not allowed', description: 'You do not have permission to delete quotes.', variant: 'destructive' });
      return;
    }
    if (!confirm(`Delete quote ${quote.id}?`)) return;
    try {
      await deleteQuote(quote.id);
      toast({ title: 'Deleted', description: `${quote.id} deleted.` });
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message ? String(e.message) : 'Could not delete', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary">Quotes</h1>
        <Button onClick={handleNew} variant="accent" disabled={!ability.can('create', 'Quote')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Quote
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="max-w-md">
          <Input
            placeholder="Search quotes (id, title, customer…)"
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
              {' '}• Total <span className="font-medium text-foreground">{meta.total}</span>
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

      <QuotesTable
        quotes={quotes}
        loading={loading}
        error={error}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <QuoteDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        quote={editing}
        customers={customers}
        opportunities={opportunities}
        onCreate={createQuote}
        onUpdate={updateQuote}
      />
    </div>
  );
}
