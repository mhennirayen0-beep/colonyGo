
"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { CustomerTable } from "@/components/customers/customer-table";
import { CustomerDialog } from "@/components/customers/customer-dialog";
import { Button } from "@/components/ui/button";
import type { Customer } from "@/lib/types";

export default function CustomersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleNewCustomer = () => {
    setSelectedCustomer(null);
    setDialogOpen(true);
  };

  const handleEditCustomer = (customer: Customer) => {
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
        <Button onClick={handleNewCustomer} variant="accent">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Customer
        </Button>
      </div>
      
      <CustomerTable onEdit={handleEditCustomer} />

      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={selectedCustomer}
        onFormSubmit={handleDialogClose}
      />
    </div>
  );
}
