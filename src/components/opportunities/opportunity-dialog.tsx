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
import type { Company, Contact, Opportunity } from '@/lib/types';
import { useOpportunitiesStore } from '@/lib/opportunities-store';
import { useCustomers } from '@/hooks/use-customers';
import { useAbility } from '@/lib/ability';
import { api } from '@/lib/api-client';

const opportunitySchema = z.object({
  opportunityname: z.string().min(1, 'Name is required'),
  opportunitydescription: z.string().optional(),
  customerid: z.string().min(1, 'Client is required'),
  companyid: z.string().optional(),
  contactid: z.string().optional(),
  value_forecast: z.coerce.number().min(0, 'Value must be a positive number'),
  opportunityphase: z.enum(['Prospection', 'Discovery', 'Evaluation', 'Deal']),
  opportunitystatut: z.enum(['Forecast', 'Start', 'Stop', 'Cancelled']),
  currency: z.enum(['EUR', 'USD', 'GBP']).default('EUR'),
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
  const canSave = opportunity ? ability.can('update', 'Opportunity') : ability.can('create', 'Opportunity');
  const canViewCompanies = ability.can('view', 'Company');
  const canViewContacts = ability.can('view', 'Contact');
  const { customers } = useCustomers();
  const { createOpportunity, upsertOpportunity } = useOpportunitiesStore();
  const [saving, setSaving] = useState(false);

  const [companies, setCompanies] = useState<Company[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const form = useForm<OpportunityFormValues>({
    resolver: zodResolver(opportunitySchema),
  });

  const currency = form.watch('currency');
  const companyid = form.watch('companyid');

  // Load a lightweight list of companies for deal linkage.
  useEffect(() => {
    if (!open) return;
    if (!canViewCompanies) {
      setCompanies([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingCompanies(true);
        const res: any = await api.get('/companies?page=1&limit=100');
        const items = Array.isArray(res?.data) ? res.data : Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
        const mapped: Company[] = items.map((doc: any) => ({
          id: String(doc?.companyId ?? doc?.id ?? ''),
          name: String(doc?.name ?? ''),
          industry: doc?.industry ? String(doc.industry) : undefined,
          website: doc?.website ? String(doc.website) : undefined,
          email: doc?.email ? String(doc.email) : undefined,
          phone: doc?.phone ? String(doc.phone) : undefined,
          address: doc?.address ? String(doc.address) : undefined,
        })).filter((c: Company) => Boolean(c.id));
        if (!cancelled) setCompanies(mapped);
      } catch {
        if (!cancelled) setCompanies([]);
      } finally {
        if (!cancelled) setLoadingCompanies(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, canViewCompanies]);

  // Load contacts whenever company changes.
  useEffect(() => {
    if (!open) return;
    if (!canViewContacts) {
      setContacts([]);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        setLoadingContacts(true);
        const params = new URLSearchParams();
        params.set('page', '1');
        params.set('limit', '100');
        const cid = (companyid ?? '').trim();
        if (cid) params.set('companyId', cid);
        const res: any = await api.get('/contacts?' + params.toString());
        const items = Array.isArray(res?.data) ? res.data : Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
        const mapped: Contact[] = items.map((doc: any) => ({
          id: String(doc?.contactId ?? doc?.id ?? ''),
          name: String(doc?.name ?? ''),
          title: doc?.title ? String(doc.title) : undefined,
          email: doc?.email ? String(doc.email) : undefined,
          phone: doc?.phone ? String(doc.phone) : undefined,
          notes: doc?.notes ? String(doc.notes) : undefined,
          companyId: doc?.companyId ? String(doc.companyId) : (doc?.companyid ? String(doc.companyid) : undefined),
          companyName: doc?.companyName ? String(doc.companyName) : (doc?.companyname ? String(doc.companyname) : undefined),
        })).filter((c: Contact) => Boolean(c.id));
        if (!cancelled) setContacts(mapped);
      } catch {
        if (!cancelled) setContacts([]);
      } finally {
        if (!cancelled) setLoadingContacts(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, companyid, canViewContacts]);

  useEffect(() => {
    if (open) {
      if (opportunity) {
        form.reset({
          opportunityname: opportunity.opportunityname,
          opportunitydescription: opportunity.opportunitydescription ?? '',
          customerid: opportunity.customerid,
          companyid: opportunity.companyid ?? '',
          contactid: opportunity.contactid ?? '',
          value_forecast: opportunity.value_forecast,
          opportunityphase: opportunity.opportunityphase,
          opportunitystatut: opportunity.opportunitystatut,
          currency: (opportunity.currency as any) || 'EUR',
        });
      } else {
        form.reset({
          opportunityname: '',
          opportunitydescription: '',
          customerid: '',
          companyid: '',
          contactid: '',
          value_forecast: 0,
          opportunityphase: 'Prospection',
          opportunitystatut: 'Forecast',
          currency: 'EUR',
        });
      }
    }
  }, [opportunity, form, open]);

  const onSubmit = async (values: OpportunityFormValues) => {
    if (opportunity && !ability.can('update', 'Opportunity')) {
      toast({ title: 'Not allowed', description: 'You do not have permission to edit opportunities.', variant: 'destructive' });
      return;
    }
    if (!opportunity && !ability.can('create', 'Opportunity')) {
      toast({ title: 'Not allowed', description: 'You do not have permission to create opportunities.', variant: 'destructive' });
      return;
    }

    setSaving(true);
    const customer = customers.find((c) => c.id === values.customerid);
    const company = companies.find((c) => c.id === (values.companyid ?? ''));
    const contact = contacts.find((c) => c.id === (values.contactid ?? ''));
    try {
      if (opportunity) {
        await upsertOpportunity(opportunity.id, {
        opportunityname: values.opportunityname,
        opportunitydescription: values.opportunitydescription ?? '',
        customerid: values.customerid,
        customername: customer?.name ?? opportunity.customername,
        companyid: values.companyid?.trim() ? values.companyid : '',
        companyname: company?.name ?? opportunity.companyname ?? '',
        contactid: values.contactid?.trim() ? values.contactid : '',
        contactname: contact?.name ?? opportunity.contactname ?? '',
        value_forecast: values.value_forecast,
        opportunityphase: values.opportunityphase,
        opportunitystatut: values.opportunitystatut,
        currency: values.currency,
        });
      } else {
        await createOpportunity({
        opportunityname: values.opportunityname,
        opportunitydescription: values.opportunitydescription ?? '',
        customerid: values.customerid,
        customername: customer?.name ?? 'Unknown',
        companyid: values.companyid?.trim() ? values.companyid : '',
        companyname: company?.name ?? '',
        contactid: values.contactid?.trim() ? values.contactid : '',
        contactname: contact?.name ?? '',
        value_forecast: values.value_forecast,
        opportunityphase: values.opportunityphase,
        opportunitystatut: values.opportunitystatut,
        currency: values.currency,
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
              name="companyid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company (optional)</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                    value={field.value?.trim() ? field.value : 'none'}
                    disabled={!canViewCompanies || loadingCompanies}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={!canViewCompanies ? 'No permission to view companies' : loadingCompanies ? 'Loading companies…' : 'Select a company'}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {companies.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contactid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Contact (optional)</FormLabel>
                  <Select
                    onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                    value={field.value?.trim() ? field.value : 'none'}
                    disabled={!canViewContacts || loadingContacts}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={!canViewContacts ? 'No permission to view contacts' : loadingContacts ? 'Loading contacts…' : companyid?.trim() ? 'Select a contact (filtered by company)' : 'Select a contact'}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {contacts.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Currency</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
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
                  <FormLabel>Forecast Value ({currency})</FormLabel>
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
          {!canSave ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                You don't have permission to {opportunity ? 'edit' : 'create'} opportunities.
              </div>
            ) : null}
<DialogFooter className="pt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" variant="accent" disabled={saving || !canSave}>
              {saving ? 'Saving…' : 'Save Opportunity'}
            </Button>
          </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
