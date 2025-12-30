"use client";

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';
import { useAbility } from '@/lib/ability';

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['Hardware', 'Software', 'Service']),
  price: z.coerce.number().min(0, 'Price must be a positive number'),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product | null;
  onFormSubmit: () => void;
  onCreate: (data: Partial<Product>) => Promise<any>;
  onUpdate: (id: string, data: Partial<Product>) => Promise<any>;
}

export function ProductDialog({
  open,
  onOpenChange,
  product,
  onFormSubmit,
  onCreate,
  onUpdate,
}: ProductDialogProps) {
  const { toast } = useToast();
  const ability = useAbility();
  const canSave = product ? ability.can('update', 'Product') : ability.can('create', 'Product');
  const [saving, setSaving] = useState(false);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
  });

  useEffect(() => {
    if (open) {
        if (product) {
          form.reset(product);
        } else {
          form.reset({
            name: '',
            type: 'Hardware',
            price: 0,
          });
        }
    }
  }, [product, form, open]);

  const onSubmit = async (values: ProductFormValues) => {
    if (product && !ability.can('update', 'Product')) {
      toast({ title: 'Not allowed', description: 'You do not have permission to edit products.', variant: 'destructive' });
      return;
    }
    if (!product && !ability.can('create', 'Product')) {
      toast({ title: 'Not allowed', description: 'You do not have permission to create products.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (product) await onUpdate(product.id, values);
      else await onCreate(values);
      toast({
        title: product ? 'Product Updated' : 'Product Created',
        description: `${values.name} has been successfully saved.`,
      });
      onFormSubmit();
    } catch (err: any) {
      toast({
        title: 'Save failed',
        description: err?.message ? String(err.message) : 'Could not save product.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          <DialogDescription>
            {product ? 'Update the details of the product.' : 'Fill in the details for the new product.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Hardware Pack A" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Hardware">Hardware</SelectItem>
                      <SelectItem value="Software">Software</SelectItem>
                      <SelectItem value="Service">Service</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (EUR)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 15000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          {!canSave ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              You don't have permission to {product ? 'edit' : 'create'} products.
            </div>
          ) : null}
<DialogFooter className="pt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="accent" disabled={saving || !canSave}>{saving ? 'Saving…' : 'Save Product'}</Button>
          </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
