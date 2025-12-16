"use client";

import Link from "next/link";
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
import type { Opportunity } from "@/lib/types";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
};

const phaseVariant: { [key: string]: "default" | "secondary" | "destructive" | "outline" } = {
  Prospection: "outline",
  Discovery: "secondary",
  Evaluation: "default",
  Deal: "outline",
};

const statusColor: { [key: string]: string } = {
  Forecast: "bg-status-forecast text-white",
  Start: "bg-status-start text-white",
  Stop: "bg-status-stop text-white",
  Cancelled: "bg-status-cancelled text-white",
};

interface OpportunityTableProps {
  onEdit: (opportunity: Opportunity) => void;
}

export function OpportunityTable({ onEdit }: OpportunityTableProps) {
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
              <TableHead>Phase</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Owner</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {opportunities.map((opp) => (
              <TableRow key={opp.id}>
                <TableCell className="font-medium">{opp.opportunityname}</TableCell>
                <TableCell>{opp.customername}</TableCell>
                <TableCell className="text-right">{formatCurrency(opp.value_forecast)}</TableCell>
                <TableCell>
                  <Badge variant={phaseVariant[opp.opportunityphase]}>
                    {opp.opportunityphase}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge className={statusColor[opp.opportunitystatut]}>
                    {opp.opportunitystatut}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={opp.ownerDetails?.photoURL} alt={opp.opportunityowner} />
                      <AvatarFallback>{opp.ownerDetails?.initials}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{opp.opportunityowner}</span>
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
                            <DropdownMenuItem asChild>
                              <Link href={`/opportunities/${opp.id}`}>View Details</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(opp)}>Edit</DropdownMenuItem>
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
