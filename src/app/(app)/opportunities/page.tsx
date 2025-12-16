
"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { OpportunityTable } from "@/components/opportunities/opportunity-table";
import { OpportunityDialog } from "@/components/opportunities/opportunity-dialog";
import { Button } from "@/components/ui/button";
import type { Opportunity } from "@/lib/types";

export default function OpportunitiesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);

  const handleNewOpportunity = () => {
    setSelectedOpp(null);
    setDialogOpen(true);
  };

  const handleEditOpportunity = (opportunity: Opportunity) => {
    setSelectedOpp(opportunity);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedOpp(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary">Opportunities</h1>
        <Button onClick={handleNewOpportunity}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Opportunity
        </Button>
      </div>
      
      <OpportunityTable onEdit={handleEditOpportunity} />

      <OpportunityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        opportunity={selectedOpp}
        onFormSubmit={handleDialogClose}
      />
    </div>
  );
}
