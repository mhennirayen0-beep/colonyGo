
"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { ClientTable } from "@/components/clients/client-table";
import { ClientDialog } from "@/components/clients/client-dialog";
import { Button } from "@/components/ui/button";
import type { Client } from "@/lib/types";

export default function ClientsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const handleNewClient = () => {
    setSelectedClient(null);
    setDialogOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedClient(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary">Clients</h1>
        <Button onClick={handleNewClient}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Client
        </Button>
      </div>
      
      <ClientTable onEdit={handleEditClient} />

      <ClientDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        client={selectedClient}
        onFormSubmit={handleDialogClose}
      />
    </div>
  );
}
