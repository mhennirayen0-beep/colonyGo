
"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { CustomerTable } from "@/components/customers/customer-table";
import { CustomerDialog } from "@/components/customers/customer-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Customer } from "@/lib/types";
import { useCustomers } from '@/hooks/use-customers';
import { useAbility } from '@/lib/ability';
import { useToast } from '@/hooks/use-toast';

export default function CustomersPage() {
  const { toast } = useToast();
  const ability = useAbility();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { customers, meta, loading, error, createCustomer, updateCustomer, deleteCustomer } = useCustomers({
    q: q.trim() || undefined,
    page,
    limit,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleNewCustomer = () => {
    if (!ability.can('create', 'Customer')) {
      toast({ title: 'Not allowed', description: 'You do not have permission to create customers.', variant: 'destructive' });
      return;
    }
    setSelectedCustomer(null);
    setDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
    if (!ability.can('update', 'Customer')) {
      toast({ title: 'Not allowed', description: 'You do not have permission to edit customers.', variant: 'destructive' });
      return;
    }
    setSelectedCustomer(customer);
    setDialogOpen(true);
  };


  const handleDeleteCustomer = async (id: string) => {
    if (!ability.can('delete', 'Customer')) {
      toast({ title: 'Not allowed', description: 'You do not have permission to delete customers.', variant: 'destructive' });
      return;
    }
    await deleteCustomer(id);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedCustomer(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary">Customers</h1>
        <Button onClick={handleNewCustomer} variant="accent" disabled={!ability.can('create', 'Customer')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Customer
        </Button>
      </div>
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="max-w-md">
          <Input
            placeholder="Search customers (name, email, company…)"
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
            <> • Total <span className="font-medium text-foreground">{meta.total}</span></>
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

      <CustomerTable
        customers={customers}
        loading={loading}
        error={error}
        onEdit={handleEditCustomer}
        onDelete={(c) => handleDeleteCustomer(c.id)}
      />

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={selectedCustomer}
        onFormSubmit={handleDialogClose}
        onCreate={createCustomer}
        onUpdate={updateCustomer}
      />
    </div>
  );
}
