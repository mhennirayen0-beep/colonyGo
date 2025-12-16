import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { OpportunityTable } from "@/components/opportunities/opportunity-table";

export default function OpportunitiesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary">Opportunities</h1>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Opportunity
        </Button>
      </div>
      
      <OpportunityTable />
    </div>
  );
}
