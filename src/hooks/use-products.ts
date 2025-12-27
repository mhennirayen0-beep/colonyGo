'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api-client';
import type { Product } from '@/lib/types';

function mapProduct(doc: any): Product {
  return {
    id: String(doc?.productId ?? doc?.id ?? ''),
    name: String(doc?.name ?? ''),
    type: (doc?.type ?? 'Hardware') as any,
    price: Number(doc?.price ?? 0),
  };
}

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<any>('/products');
      const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      setProducts(items.map(mapProduct));
    } catch (e: any) {
      setError(e?.message ? String(e.message) : 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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

  return { products, loading, error, reload: load, createProduct, updateProduct, deleteProduct };
}
