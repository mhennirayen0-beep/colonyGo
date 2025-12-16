import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { opportunities } from "@/lib/data";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const stageVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  Discovery: "outline",
  Proposal: "secondary",
  Negotiation: "default",
  Won: "secondary",
  Lost: "destructive"
};

const stageColor: { [key: string]: string } = {
    Won: "bg-green-500",
}

export function OpportunityTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Opportunities</CardTitle>
        <CardDescription>Create, update, and manage your sales opportunities.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Opportunity</TableHead>
              <TableHead>Client</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.map((opp) => (
              <TableRow key={opp.id}>
                <TableCell className="font-medium">{opp.title}</TableCell>
                <TableCell>{opp.client}</TableCell>
                <TableCell className="text-right">{formatCurrency(opp.value)}</TableCell>
                <TableCell>
                  <Badge variant={stageVariant[opp.stage]} className={opp.stage === 'Won' ? 'bg-green-500/20 text-green-700 border-green-500/30' : ''}>
                    {opp.stage}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={opp.owner.avatarUrl} alt={opp.owner.name} />
                      <AvatarFallback>{opp.owner.initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{opp.owner.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>View Details</DropdownMenuItem>
                            <DropdownMenuItem>Edit</DropdownMenuItem>
                             <DropdownMenuItem>Add Note</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
