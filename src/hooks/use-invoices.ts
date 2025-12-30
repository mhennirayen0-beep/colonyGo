'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import type { Invoice } from '@/lib/types';

export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
};

type UseInvoicesOptions = {
  q?: string;
  page?: number;
  limit?: number;
  customerid?: string;
  opportunityid?: string;
  quoteid?: string;
};

function mapInvoice(doc: any): Invoice {
  return {
    id: String(doc?.invoiceId ?? doc?.id ?? ''),
    title: String(doc?.title ?? ''),
    customerid: String(doc?.customerid ?? ''),
    customername: String(doc?.customername ?? ''),
    opportunityid: doc?.opportunityid ? String(doc.opportunityid) : undefined,
    opportunityname: doc?.opportunityname ? String(doc.opportunityname) : undefined,
    quoteid: doc?.quoteid ? String(doc.quoteid) : undefined,
    quotetitle: doc?.quotetitle ? String(doc.quotetitle) : undefined,
    status: (doc?.status ?? 'Draft') as any,
    currency: String(doc?.currency ?? 'EUR'),
    vat_rate: doc?.vat_rate !== undefined ? Number(doc.vat_rate) : undefined,
    line_items: Array.isArray(doc?.line_items)
      ? doc.line_items.map((it: any) => ({
          description: String(it?.description ?? ''),
          quantity: Number(it?.quantity ?? 0),
          unit_price: Number(it?.unit_price ?? 0),
          discount_percent: it?.discount_percent !== undefined ? Number(it.discount_percent) : undefined,
          productid: it?.productid ? String(it.productid) : undefined,
        }))
      : undefined,
    total_excl_tax: Number(doc?.total_excl_tax ?? 0),
    total_tax: Number(doc?.total_tax ?? 0),
    total_incl_tax: Number(doc?.total_incl_tax ?? 0),
    paid_total: doc?.paid_total !== undefined ? Number(doc.paid_total) : undefined,
    remaining_due: doc?.remaining_due !== undefined ? Number(doc.remaining_due) : undefined,
    issued_on: doc?.issued_on ? String(doc.issued_on) : undefined,
    due_on: doc?.due_on ? String(doc.due_on) : undefined,
    paid_on: doc?.paid_on ? String(doc.paid_on) : undefined,
    payment_reference: doc?.payment_reference ? String(doc.payment_reference) : undefined,
    createdAt: doc?.createdAt ? String(doc.createdAt) : undefined,
    updatedAt: doc?.updatedAt ? String(doc.updatedAt) : undefined,
  };
}

export function useInvoices(options: UseInvoicesOptions = {}) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options.q) params.set('q', options.q);
      if (typeof options.page === 'number') params.set('page', String(options.page));
      if (typeof options.limit === 'number') params.set('limit', String(options.limit));
      if (options.customerid) params.set('customerid', options.customerid);
      if (options.opportunityid) params.set('opportunityid', options.opportunityid);
      if (options.quoteid) params.set('quoteid', options.quoteid);

      const url = params.toString() ? `/invoices?${params.toString()}` : '/invoices';
      const res = await api.get<any>(url);

      const items = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
      setInvoices(items.map(mapInvoice));

      const m = res?.meta;
      if (m && typeof m === 'object') {
        setMeta({
          page: Number(m.page ?? options.page ?? 1),
          limit: Number(m.limit ?? options.limit ?? 20),
          total: Number(m.total ?? items.length),
          hasNext: Boolean(m.hasNext ?? false),
        });
      } else {
        setMeta(null);
      }
    } catch (e: any) {
      setError(e?.message ? String(e.message) : 'Failed to load invoices');
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [options.q, options.page, options.limit, options.customerid, options.opportunityid, options.quoteid]);

  useEffect(() => {
    load();
  }, [load]);

  const deleteInvoice = useCallback(
    async (invoiceId: string) => {
      await api.delete(`/invoices/${encodeURIComponent(invoiceId)}`);
      await load();
    },
    [load],
  );

  const createInvoice = useCallback(
    async (data: Partial<Invoice>) => {
      const payload = {
        title: data.title,
        customerid: data.customerid,
        customername: data.customername,
        opportunityid: data.opportunityid,
        opportunityname: data.opportunityname,
        quoteid: data.quoteid,
        quotetitle: data.quotetitle,
        status: data.status,
        currency: data.currency,
        total_excl_tax: data.total_excl_tax,
        total_tax: data.total_tax,
        total_incl_tax: data.total_incl_tax,
        issued_on: data.issued_on,
        due_on: data.due_on,
        payment_reference: data.payment_reference,
        vat_rate: data.vat_rate,
        line_items: data.line_items,
      };
      const created = await api.post<any>('/invoices', payload);
      await load();
      return mapInvoice(created);
    },
    [load],
  );

  const updateInvoice = useCallback(
    async (invoiceId: string, data: Partial<Invoice>) => {
      const payload = {
        title: data.title,
        customerid: data.customerid,
        customername: data.customername,
        opportunityid: data.opportunityid,
        opportunityname: data.opportunityname,
        quoteid: data.quoteid,
        quotetitle: data.quotetitle,
        status: data.status,
        currency: data.currency,
        total_excl_tax: data.total_excl_tax,
        total_tax: data.total_tax,
        total_incl_tax: data.total_incl_tax,
        issued_on: data.issued_on,
        due_on: data.due_on,
        payment_reference: data.payment_reference,
        vat_rate: data.vat_rate,
        line_items: data.line_items,
      };
      const updated = await api.patch<any>(`/invoices/${encodeURIComponent(invoiceId)}`, payload);
      await load();
      return mapInvoice(updated);
    },
    [load],
  );

  return {
    invoices,
    meta,
    loading,
    error,
    reload: load,
    createInvoice,
    updateInvoice,
    deleteInvoice,
  };
}
