'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import type { Quote } from '@/lib/types';

export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
};

type UseQuotesOptions = {
  q?: string;
  page?: number;
  limit?: number;
  customerid?: string;
  opportunityid?: string;
};

function mapQuote(doc: any): Quote {
  return {
    id: String(doc?.quoteId ?? doc?.id ?? ''),
    title: String(doc?.title ?? ''),
    customerid: String(doc?.customerid ?? ''),
    customername: String(doc?.customername ?? ''),
    opportunityid: doc?.opportunityid ? String(doc.opportunityid) : undefined,
    opportunityname: doc?.opportunityname ? String(doc.opportunityname) : undefined,
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
    valid_until: doc?.valid_until ? String(doc.valid_until) : undefined,
    sent_on: doc?.sent_on ? String(doc.sent_on) : undefined,
    accepted_on: doc?.accepted_on ? String(doc.accepted_on) : undefined,
    rejected_on: doc?.rejected_on ? String(doc.rejected_on) : undefined,
    expired_on: doc?.expired_on ? String(doc.expired_on) : undefined,
    createdAt: doc?.createdAt ? String(doc.createdAt) : undefined,
    updatedAt: doc?.updatedAt ? String(doc.updatedAt) : undefined,
  };
}

export function useQuotes(options: UseQuotesOptions = {}) {
  const [quotes, setQuotes] = useState<Quote[]>([]);
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

      const url = params.toString() ? `/quotes?${params.toString()}` : '/quotes';
      const res = await api.get<any>(url);

      const items = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
      setQuotes(items.map(mapQuote));

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
      setError(e?.message ? String(e.message) : 'Failed to load quotes');
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [options.q, options.page, options.limit, options.customerid, options.opportunityid]);

  useEffect(() => {
    load();
  }, [load]);

  const createQuote = useCallback(
    async (data: Partial<Quote>) => {
      const payload = {
        title: data.title,
        customerid: data.customerid,
        customername: data.customername,
        opportunityid: data.opportunityid,
        opportunityname: data.opportunityname,
        status: data.status,
        currency: data.currency,
        total_excl_tax: data.total_excl_tax,
        total_tax: data.total_tax,
        total_incl_tax: data.total_incl_tax,
        valid_until: data.valid_until,
        vat_rate: data.vat_rate,
        line_items: data.line_items,
      };
      const created = await api.post<any>('/quotes', payload);
      await load();
      return mapQuote(created);
    },
    [load],
  );

  const updateQuote = useCallback(
    async (quoteId: string, data: Partial<Quote>) => {
      const payload = {
        title: data.title,
        customerid: data.customerid,
        customername: data.customername,
        opportunityid: data.opportunityid,
        opportunityname: data.opportunityname,
        status: data.status,
        currency: data.currency,
        total_excl_tax: data.total_excl_tax,
        total_tax: data.total_tax,
        total_incl_tax: data.total_incl_tax,
        valid_until: data.valid_until,
        vat_rate: data.vat_rate,
        line_items: data.line_items,
      };
      const updated = await api.patch<any>(`/quotes/${encodeURIComponent(quoteId)}`, payload);
      await load();
      return mapQuote(updated);
    },
    [load],
  );

  const deleteQuote = useCallback(
    async (quoteId: string) => {
      await api.delete(`/quotes/${encodeURIComponent(quoteId)}`);
      await load();
    },
    [load],
  );

  return { quotes, meta, loading, error, reload: load, createQuote, updateQuote, deleteQuote };
}
