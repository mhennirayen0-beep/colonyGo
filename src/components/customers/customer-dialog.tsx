
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
import { useToast } from '@/hooks/use-toast';
import type { Customer } from '@/lib/types';
import { useAbility } from '@/lib/ability';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  company: z.string().min(1, 'Company is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  sector: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  onFormSubmit: () => void;
  onCreate: (data: Partial<Customer>) => Promise<any>;
  onUpdate: (id: string, data: Partial<Customer>) => Promise<any>;
}

export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  onFormSubmit,
  onCreate,
  onUpdate,
}: CustomerDialogProps) {
  const { toast } = useToast();
  const ability = useAbility();
  const [saving, setSaving] = useState(false);
  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: '',
      company: '',
      email: '',
      sector: '',
    },
  });

  useEffect(() => {
    if (open) {
        if (customer) {
          form.reset(customer);
        } else {
          form.reset({
            name: '',
            company: '',
            email: '',
            sector: '',
          });
        }
    }
  }, [customer, form, open]);

  const onSubmit = async (values: CustomerFormValues) => {
    if (customer && !ability.can('update', 'Customer')) return;
    if (!customer && !ability.can('create', 'Customer')) return;

    setSaving(true);
    try {
      if (customer) {
        await onUpdate(customer.id, values);
      } else {
        await onCreate(values);
      }
      toast({
        title: customer ? 'Customer Updated' : 'Customer Created',
        description: `${values.name} has been successfully saved.`,
      });
      onFormSubmit();
    } catch (err: any) {
      toast({
        title: 'Save failed',
        description: err?.message ? String(err.message) : 'Could not save customer.',
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
          <DialogTitle>{customer ? 'Edit Customer' : 'Add New Customer'}</DialogTitle>
          <DialogDescription>
            {customer ? 'Update the details of the customer.' : 'Fill in the details for the new customer.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Amazon Web Services" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="company"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., AWS" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="e.g., contact@aws.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="sector"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sector</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Cloud Computing" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          <DialogFooter className="pt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="accent" disabled={saving}>
              {saving ? 'Saving…' : 'Save Customer'}
            </Button>
          </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
