"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { ProductTable } from "@/components/products/product-table";
import { ProductDialog } from "@/components/products/product-dialog";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types";
import { useProducts } from '@/hooks/use-products';
import { useAbility } from '@/lib/ability';
import { useToast } from '@/hooks/use-toast';

export default function ProductsPage() {
  const { toast } = useToast();
  const ability = useAbility();
  const { products, loading, error, createProduct, updateProduct, deleteProduct } = useProducts();
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

      <ProductTable
        products={products}
        loading={loading}
        error={error}
        onEdit={handleEditProduct}
        onDelete={(p) => deleteProduct(p.id)}
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
