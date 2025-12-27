'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import type { Customer } from '@/lib/types';

function mapCustomer(doc: any): Customer {
  return {
    id: String(doc?.customerId ?? doc?.id ?? ''),
    name: String(doc?.name ?? ''),
    company: String(doc?.company ?? ''),
    email: doc?.email ? String(doc.email) : undefined,
    phone: doc?.phone ? String(doc.phone) : undefined,
    sector: doc?.sector ? String(doc.sector) : undefined,
    category: doc?.category ? String(doc.category) : undefined,
    avatarUrl: doc?.avatarUrl ? String(doc.avatarUrl) : undefined,
  };
}

export function useCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<any>('/customers');
      const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      setCustomers(items.map(mapCustomer));
    } catch (e: any) {
      setError(e?.message ? String(e.message) : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const createCustomer = useCallback(async (data: Partial<Customer>) => {
    const payload = {
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      sector: data.sector,
      category: data.category,
      avatarUrl: data.avatarUrl,
    };
    const created = await api.post<any>('/customers', payload);
    await load();
    return mapCustomer(created);
  }, [load]);

  const updateCustomer = useCallback(async (customerId: string, data: Partial<Customer>) => {
    const payload = {
      name: data.name,
      company: data.company,
      email: data.email,
      phone: data.phone,
      sector: data.sector,
      category: data.category,
      avatarUrl: data.avatarUrl,
    };
    const updated = await api.patch<any>(`/customers/${encodeURIComponent(customerId)}`, payload);
    await load();
    return mapCustomer(updated);
  }, [load]);

  const deleteCustomer = useCallback(async (customerId: string) => {
    await api.delete(`/customers/${encodeURIComponent(customerId)}`);
    await load();
  }, [load]);

  return {
    customers,
    loading,
    error,
    reload: load,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
