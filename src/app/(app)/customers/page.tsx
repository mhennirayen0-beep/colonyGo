
"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { CustomerTable } from "@/components/customers/customer-table";
import { CustomerDialog } from "@/components/customers/customer-dialog";
import { Button } from "@/components/ui/button";
import type { Customer } from "@/lib/types";
import { useCustomers } from '@/hooks/use-customers';
import { useAbility } from '@/lib/ability';
import { useToast } from '@/hooks/use-toast';

export default function CustomersPage() {
  const { toast } = useToast();
  const ability = useAbility();
  const { customers, loading, error, createCustomer, updateCustomer, deleteCustomer } = useCustomers();
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
      
      <CustomerTable
        customers={customers}
        loading={loading}
        error={error}
        onEdit={handleEditCustomer}
        onDelete={(c) => deleteCustomer(c.id)}
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
