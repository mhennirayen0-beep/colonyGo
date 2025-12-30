'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import type { Product } from '@/lib/types';

export type PageMeta = {
  page: number;
  limit: number;
  total: number;
  hasNext: boolean;
};

type UseProductsOptions = {
  q?: string;
  page?: number;
  limit?: number;
  /** If false, the hook won't call the API (useful when user lacks permissions). */
  enabled?: boolean;
};

function mapProduct(doc: any): Product {
  return {
    id: String(doc?.productId ?? doc?.id ?? ''),
    name: String(doc?.name ?? ''),
    type: (doc?.type ?? 'Hardware') as any,
    price: Number(doc?.price ?? 0),
  };
}

export function useProducts(options: UseProductsOptions = {}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PageMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (options.enabled === false) {
      setProducts([]);
      setMeta(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (options.q) params.set('q', options.q);
      if (typeof options.page === 'number') params.set('page', String(options.page));
      if (typeof options.limit === 'number') params.set('limit', String(options.limit));

      const url = params.toString() ? `/products?${params.toString()}` : '/products';
      const res = await api.get<any>(url);
      const items = Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
      setProducts(items.map(mapProduct));

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
      setError(e?.message ? String(e.message) : 'Failed to load products');
      setMeta(null);
    } finally {
      setLoading(false);
    }
  }, [options.q, options.page, options.limit, options.enabled]);

  useEffect(() => {
    if (options.enabled === false) return;
    load();
  }, [load, options.enabled]);

  const createProduct = useCallback(async (data: Partial<Product>) => {
    const payload = {
      name: data.name,
      type: data.type,
      price: data.price,
    };
    const created = await api.post<any>('/products', payload);
    await load();
    return mapProduct(created);
  }, [load]);

  const updateProduct = useCallback(async (productId: string, data: Partial<Product>) => {
    const payload = {
      name: data.name,
      type: data.type,
      price: data.price,
    };
    const updated = await api.patch<any>(`/products/${encodeURIComponent(productId)}`, payload);
    await load();
    return mapProduct(updated);
  }, [load]);

  const deleteProduct = useCallback(async (productId: string) => {
    await api.delete(`/products/${encodeURIComponent(productId)}`);
    await load();
  }, [load]);

  return { products, meta, loading, error, reload: load, createProduct, updateProduct, deleteProduct };
}
