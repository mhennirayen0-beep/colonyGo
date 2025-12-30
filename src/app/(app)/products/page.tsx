"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { ProductTable } from "@/components/products/product-table";
import { ProductDialog } from "@/components/products/product-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Product } from "@/lib/types";
import { useProducts } from '@/hooks/use-products';
import { useAbility } from '@/lib/ability';
import { useToast } from '@/hooks/use-toast';

export default function ProductsPage() {
  const { toast } = useToast();
  const ability = useAbility();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const { products, meta, loading, error, createProduct, updateProduct, deleteProduct } = useProducts({
    q: q.trim() || undefined,
    page,
    limit,
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleNewProduct = () => {
    if (!ability.can('create', 'Product')) {
      toast({ title: 'Not allowed', description: 'You do not have permission to create products.', variant: 'destructive' });
      return;
    }
    setSelectedProduct(null);
    setDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    if (!ability.can('update', 'Product')) {
      toast({ title: 'Not allowed', description: 'You do not have permission to edit products.', variant: 'destructive' });
      return;
    }
    setSelectedProduct(product);
    setDialogOpen(true);
  };


  const handleDeleteProduct = async (id: string) => {
    if (!ability.can('delete', 'Product')) {
      toast({ title: 'Not allowed', description: 'You do not have permission to delete products.', variant: 'destructive' });
      return;
    }
    await deleteProduct(id);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-primary">
          Products
        </h1>
        <Button onClick={handleNewProduct} variant="accent" disabled={!ability.can('create', 'Product')}>
          <PlusCircle className="mr-2 h-4 w-4" />
          New Product
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="max-w-md">
          <Input
            placeholder="Search products (name, type…)"
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

      <ProductTable
        products={products}
        loading={loading}
        error={error}
        onEdit={handleEditProduct}
        onDelete={(p) => handleDeleteProduct(p.id)}
      />

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={selectedProduct}
        onFormSubmit={handleDialogClose}
        onCreate={createProduct}
        onUpdate={updateProduct}
      />
    </div>
  );
}
