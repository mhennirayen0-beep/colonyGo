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
import { MoreHorizontal } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import type { Product } from "@/lib/types";

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete?: (product: Product) => void;
  loading?: boolean;
  error?: string | null;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

export function ProductTable({ products, onEdit, onDelete, loading, error }: ProductTableProps) {
  const ability = useAbility();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Product List</CardTitle>
        <CardDescription>Manage your company's products and services.</CardDescription>
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
              <TableHead>Product Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-muted-foreground">Loading…</TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-sm text-muted-foreground">No products.</TableCell>
              </TableRow>
            ) : products.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.type}</TableCell>
                <TableCell className="text-right">{formatCurrency(product.price)}</TableCell>
                <TableCell>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {ability.can('update', 'Product') ? (
                              <DropdownMenuItem onClick={() => onEdit(product)}>Edit</DropdownMenuItem>
                            ) : null}
                            {onDelete && ability.can('delete', 'Product') ? (
                              <DropdownMenuItem onClick={() => onDelete(product)} className="text-destructive">Delete</DropdownMenuItem>
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
