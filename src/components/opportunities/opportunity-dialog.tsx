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
import type { Opportunity } from '@/lib/types';
import { useOpportunitiesStore } from '@/lib/opportunities-store';
import { useCustomers } from '@/hooks/use-customers';
import { useAbility } from '@/lib/ability';

const opportunitySchema = z.object({
  opportunityname: z.string().min(1, 'Name is required'),
  opportunitydescription: z.string().optional(),
  customerid: z.string().min(1, 'Client is required'),
  value_forecast: z.coerce.number().min(0, 'Value must be a positive number'),
  opportunityphase: z.enum(['Prospection', 'Discovery', 'Evaluation', 'Deal']),
  opportunitystatut: z.enum(['Forecast', 'Start', 'Stop', 'Cancelled']),
});

type OpportunityFormValues = z.infer<typeof opportunitySchema>;

interface OpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  opportunity: Opportunity | null;
  onFormSubmit: () => void;
}

export function OpportunityDialog({
  open,
  onOpenChange,
  opportunity,
  onFormSubmit,
}: OpportunityDialogProps) {
  const { toast } = useToast();
  const ability = useAbility();
  const { customers } = useCustomers();
  const { createOpportunity, upsertOpportunity } = useOpportunitiesStore();
  const [saving, setSaving] = useState(false);
  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema),
  });

  useEffect(() => {
    if (open) {
      if (opportunity) {
        form.reset({
          opportunityname: opportunity.opportunityname,
          opportunitydescription: opportunity.opportunitydescription ?? '',
          customerid: opportunity.customerid,
          value_forecast: opportunity.value_forecast,
          opportunityphase: opportunity.opportunityphase,
          opportunitystatut: opportunity.opportunitystatut,
        });
      } else {
        form.reset({
          opportunityname: '',
          opportunitydescription: '',
          customerid: '',
          value_forecast: 0,
          opportunityphase: 'Prospection',
          opportunitystatut: 'Forecast',
        });
      }
    }
  }, [opportunity, form, open]);

  const onSubmit = async (values: OpportunityFormValues) => {
    if (opportunity && !ability.can('update', 'Opportunity')) return;
    if (!opportunity && !ability.can('create', 'Opportunity')) return;

    setSaving(true);
    const customer = customers.find((c) => c.id === values.customerid);
    try {
      if (opportunity) {
        await upsertOpportunity(opportunity.id, {
        opportunityname: values.opportunityname,
        opportunitydescription: values.opportunitydescription ?? '',
        customerid: values.customerid,
        customername: customer?.name ?? opportunity.customername,
        value_forecast: values.value_forecast,
        opportunityphase: values.opportunityphase,
        opportunitystatut: values.opportunitystatut,
        });
      } else {
        await createOpportunity({
        opportunityname: values.opportunityname,
        opportunitydescription: values.opportunitydescription ?? '',
        customerid: values.customerid,
        customername: customer?.name ?? 'Unknown',
        value_forecast: values.value_forecast,
        opportunityphase: values.opportunityphase,
        opportunitystatut: values.opportunitystatut,
        });
      }

      toast({
        title: opportunity ? 'Opportunity Updated' : 'Opportunity Created',
        description: `${values.opportunityname} has been successfully saved.`,
      });

      onFormSubmit();
    } catch (err: any) {
      toast({
        title: 'Save failed',
        description: err?.message ? String(err.message) : 'Could not save opportunity.',
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
          <DialogTitle>{opportunity ? 'Edit Opportunity' : 'Add New Opportunity'}</DialogTitle>
          <DialogDescription>
            {opportunity ? 'Update the details of the opportunity.' : 'Fill in the details for the new opportunity.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-6">
            <FormField
              control={form.control}
              name="opportunityname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opportunity Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Project Phoenix Deployment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="opportunitydescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Short description…" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customerid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                   <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a client" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="value_forecast"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Forecast Value (USD)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 120000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="opportunityphase"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phase</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a phase" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Prospection">Prospection</SelectItem>
                      <SelectItem value="Discovery">Discovery</SelectItem>
                      <SelectItem value="Evaluation">Evaluation</SelectItem>
                      <SelectItem value="Deal">Deal</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="opportunitystatut"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Forecast">Forecast</SelectItem>
                      <SelectItem value="Start">Start</SelectItem>
                      <SelectItem value="Stop">Stop</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
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
              {saving ? 'Saving…' : 'Save Opportunity'}
            </Button>
          </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
