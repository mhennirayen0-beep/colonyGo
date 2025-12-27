
"use client";

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
import { useAbility } from '@/lib/ability';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import type { Customer } from "@/lib/types";

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
  loading?: boolean;
  error?: string | null;
}

function initialsFor(name?: string) {
  if (!name) return 'C';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('');
}

export function CustomerTable({ customers, onEdit, onDelete, loading, error }: CustomerTableProps) {
  const ability = useAbility();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Customers</CardTitle>
        <CardDescription>Manage your customer contacts and companies.</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="mb-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Sector</TableHead>
              <TableHead>Email</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-muted-foreground">Loading…</TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-muted-foreground">No customers.</TableCell>
              </TableRow>
            ) : customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={customer.avatarUrl} alt={customer.name} />
                      <AvatarFallback>{customer.initials ?? initialsFor(customer.name)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{customer.name}</span>
                  </div>
                </TableCell>
                <TableCell>{customer.sector}</TableCell>
                <TableCell>{customer.email || 'N/A'}</TableCell>
                <TableCell>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {ability.can('update', 'Customer') ? (
                              <DropdownMenuItem onClick={() => onEdit(customer)}>Edit</DropdownMenuItem>
                            ) : null}
                            {onDelete && ability.can('delete', 'Customer') ? (
                              <DropdownMenuItem onClick={() => onDelete(customer)} className="text-destructive">Delete</DropdownMenuItem>
                            ) : null}
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
