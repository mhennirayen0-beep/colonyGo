"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { ProductTable } from "@/components/products/product-table";
import { ProductDialog } from "@/components/products/product-dialog";
import { Button } from "@/components/ui/button";
import type { Product } from "@/lib/types";

export default function ProductsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleNewProduct = () => {
    setSelectedProduct(null);
    setDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
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
        <h1 className="text-3xl font-headline font-bold text-primary">Products</h1>
        <Button onClick={handleNewProduct} variant="accent">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Product
        </Button>
      </div>
      
      <ProductTable onEdit={handleEditProduct} />

      <ProductDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={selectedProduct}
        onFormSubmit={handleDialogClose}
      />
    </div>
  );
}
