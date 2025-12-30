'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import type { Payment } from '@/lib/types';

export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
};

type UsePaymentsOptions = {
  q?: string;
  page?: number;
  limit?: number;
  invoiceid?: string;
  customerid?: string;
  method?: Payment["method"];
};

function mapPayment(doc: any): Payment {
  return {
    id: String(doc?.paymentId ?? doc?.id ?? ''),
    invoiceid: String(doc?.invoiceid ?? ''),
    invoicetitle: doc?.invoicetitle ? String(doc.invoicetitle) : undefined,
    customerid: String(doc?.customerid ?? ''),
    customername: String(doc?.customername ?? ''),
    currency: String(doc?.currency ?? 'EUR'),
    amount: Number(doc?.amount ?? 0),
    method: (doc?.method ?? 'Transfer') as any,
    paid_on: doc?.paid_on ? String(doc.paid_on) : new Date().toISOString(),
    reference: doc?.reference ? String(doc.reference) : undefined,
    note: doc?.note ? String(doc.note) : undefined,
    createdAt: doc?.createdAt ? String(doc.createdAt) : undefined,
    updatedAt: doc?.updatedAt ? String(doc.updatedAt) : undefined,
  };
}

export function usePayments(options: UsePaymentsOptions = {}) {
  const [payments, setPayments] = useState<Payment[]>([]);
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
      if (options.invoiceid) params.set('invoiceid', options.invoiceid);
      if (options.customerid) params.set('customerid', options.customerid);
      if (options.method) params.set('method', String(options.method));

      const url = params.toString() ? `/payments?${params.toString()}` : '/payments';
      const res = await api.get<any>(url);

      const items = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
      setPayments(items.map(mapPayment));

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
      setError(e?.message ? String(e.message) : 'Failed to load payments');
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [options.q, options.page, options.limit, options.invoiceid, options.customerid, options.method]);

  useEffect(() => {
    load();
  }, [load]);

  const createPayment = useCallback(
    async (data: Partial<Payment> & { invoiceid: string; amount: number }) => {
      const payload = {
        invoiceid: data.invoiceid,
        amount: data.amount,
        method: data.method,
        paid_on: data.paid_on,
        reference: data.reference,
        note: data.note,
      };
      const created = await api.post<any>('/payments', payload);
      await load();
      return mapPayment(created);
    },
    [load],
  );

  const deletePayment = useCallback(
    async (paymentId: string) => {
      await api.delete(`/payments/${encodeURIComponent(paymentId)}`);
      await load();
    },
    [load],
  );

  return {
    payments,
    meta,
    loading,
    error,
    reload: load,
    createPayment,
    deletePayment,
  };
}
