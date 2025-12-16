
"use client";

import { useEffect } from 'react';
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

const opportunitySchema = z.object({
  title: z.string().min(1, 'Title is required'),
  client: z.string().min(1, 'Client is required'),
  value: z.coerce.number().min(0, 'Value must be a positive number'),
  stage: z.enum(['Discovery', 'Proposal', 'Negotiation', 'Won', 'Lost']),
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
  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema),
    defaultValues: {
      title: '',
      client: '',
      value: 0,
      stage: 'Discovery',
    },
  });

  useEffect(() => {
    if (open) {
        if (opportunity) {
          form.reset(opportunity);
        } else {
          form.reset({
            title: '',
            client: '',
            value: 0,
            stage: 'Discovery',
          });
        }
    }
  }, [opportunity, form, open]);

  const onSubmit = (values: OpportunityFormValues) => {
    console.log(values);

    toast({
      title: opportunity ? 'Opportunity Updated' : 'Opportunity Created',
      description: `${values.title} has been successfully saved.`,
    });
    
    onFormSubmit();
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
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opportunity Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Project Phoenix Deployment" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="client"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Innovate Corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value (USD)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 120000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="stage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stage</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a stage" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Discovery">Discovery</SelectItem>
                      <SelectItem value="Proposal">Proposal</SelectItem>
                      <SelectItem value="Negotiation">Negotiation</SelectItem>
                      <SelectItem value="Won">Won</SelectItem>
                      <SelectItem value="Lost">Lost</SelectItem>
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
            <Button type="submit">Save Opportunity</Button>
          </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
