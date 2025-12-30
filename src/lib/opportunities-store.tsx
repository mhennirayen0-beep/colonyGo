'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Opportunity } from '@/lib/types';
import { api } from '@/lib/api-client';

export type OpportunityNote = {
  id: string;
  opportunityId: string;
  text: string;
  createdAtISO: string;
  source: 'user' | 'ai';
};

type OpportunitiesState = {
  opportunities: Opportunity[];
  notesByOpportunityId: Record<string, OpportunityNote[]>;
  loading: boolean;
};

// We load opportunities for dashboards/analytics. Backend is paginated (max 100 per page),
// so we fetch multiple pages on initial load to avoid showing only the first 25 rows.
// Keep a reasonable cap to avoid heavy startup requests on very large datasets.
const OPPS_PAGE_LIMIT = 100;
const OPPS_MAX_PAGES = 10; // cap at 1000 rows

type OpportunitiesStore = OpportunitiesState & {
  reloadOpportunities: () => Promise<void>;
  fetchOpportunityById: (id: string) => Promise<Opportunity | undefined>;
  upsertOpportunity: (id: string, patch: Partial<Opportunity>) => Promise<Opportunity>;
  createOpportunity: (patch: Partial<Opportunity>) => Promise<Opportunity>;
  addNote: (opportunityId: string, text: string, source?: 'user' | 'ai') => Promise<void>;
  loadNotesForOpportunity: (opportunityId: string) => Promise<OpportunityNote[]>;
  getOpportunityById: (id: string) => Opportunity | undefined;
  getNotesForOpportunity: (id: string) => OpportunityNote[];
};

const Ctx = createContext<OpportunitiesStore | null>(null);

function mapOpportunity(doc: any): Opportunity {
  return {
    // Backend returns `id` + `createdAtISO`, but we accept older shapes too.
    id: String(doc?.opportunityId ?? doc?.id ?? ''),
    createdAtISO: String(doc?.createdAtISO ?? doc?.createdAt ?? new Date().toISOString()),
    currency: String(doc?.currency ?? 'EUR'),
    opportunityname: String(doc?.opportunityName ?? doc?.opportunityname ?? ''),
    opportunitydescription: String(doc?.opportunityDescription ?? doc?.opportunitydescription ?? ''),
    customerid: String(doc?.customerId ?? doc?.customerid ?? ''),
    customername: String(doc?.customerName ?? doc?.customername ?? doc?.customerId ?? ''),
    companyid: String(doc?.companyId ?? doc?.companyid ?? '') || undefined,
    companyname: String(doc?.companyName ?? doc?.companyname ?? '') || undefined,
    contactid: String(doc?.contactId ?? doc?.contactid ?? '') || undefined,
    contactname: String(doc?.contactName ?? doc?.contactname ?? '') || undefined,
    opportunitystatut: (doc?.statut ?? doc?.opportunitystatut ?? 'Forecast') as any,
    opportunityphase: (doc?.phase ?? doc?.opportunityphase ?? 'Prospection') as any,
    hardware_price: Number(doc?.hardwarePrice ?? doc?.hardware_price ?? 0),
    software_price: Number(doc?.softwarePrice ?? doc?.software_price ?? 0),
    service_price: Number(doc?.servicePrice ?? doc?.service_price ?? 0),
    opportunityowner: String(doc?.opportunityOwner ?? doc?.opportunityowner ?? doc?.ownerUserId ?? '—'),
    swot_strength: Number(doc?.swotStrength ?? doc?.swot_strength ?? 0),
    swot_weakness: Number(doc?.swotWeakness ?? doc?.swot_weakness ?? 0),
    swot_opportunities: Number(doc?.swotOpportunities ?? doc?.swot_opportunities ?? 0),
    swot_threats: Number(doc?.swotThreats ?? doc?.swot_threats ?? 0),
    value_forecast: Number(doc?.valueForecast ?? doc?.value_forecast ?? 0),
    value_final: Number(doc?.valueFinal ?? doc?.value_final ?? 0),
    value_discount: Number(doc?.valueDiscount ?? doc?.value_discount ?? 0),
    value_budget: Number(doc?.valueBudget ?? doc?.value_budget ?? 0),
    value_customer: Number(doc?.valueCustomer ?? doc?.value_customer ?? 0),
    value_bonus: Number(doc?.valueBonus ?? doc?.value_bonus ?? 0),
    opportunityscl: String(doc?.opportunityScl ?? doc?.opportunityscl ?? ''),
  };
}

function toCreatePayload(patch: Partial<Opportunity>) {
  // IMPORTANT: backend DTOs are snake_case + strict ValidationPipe (forbidNonWhitelisted)
  // So we must send the exact field names.
  return {
    opportunityname: patch.opportunityname,
    opportunitydescription: patch.opportunitydescription,
    customerid: patch.customerid,
    customername: patch.customername,
    companyid: patch.companyid,
    companyname: patch.companyname,
    contactid: patch.contactid,
    contactname: patch.contactname,
    opportunitystatut: patch.opportunitystatut,
    opportunityphase: patch.opportunityphase,
    hardware_price: patch.hardware_price,
    software_price: patch.software_price,
    service_price: patch.service_price,
    opportunityowner: patch.opportunityowner,
    swot_strength: patch.swot_strength,
    swot_weakness: patch.swot_weakness,
    swot_opportunities: patch.swot_opportunities,
    swot_threats: patch.swot_threats,
    value_forecast: patch.value_forecast,
    value_final: patch.value_final,
    value_discount: patch.value_discount,
    value_budget: patch.value_budget,
    value_customer: patch.value_customer,
    value_bonus: patch.value_bonus,
    opportunityscl: patch.opportunityscl,
    currency: patch.currency ?? 'EUR',
    // Optional custom id support (backend expects `id`)
    id: patch.id,
  };
}

function mapNote(doc: any): OpportunityNote {
  return {
    id: String(doc?.id ?? doc?.noteId ?? doc?._id ?? ''),
    opportunityId: String(doc?.opportunityId ?? ''),
    text: String(doc?.text ?? ''),
    // Backend returns `createdAtISO`. We also accept older shapes.
    createdAtISO: String(doc?.createdAtISO ?? doc?.createdAt ?? new Date().toISOString()),
    source: (doc?.source ?? 'user') as any,
  };
}

export function OpportunitiesProvider({ children }: { children: React.ReactNode }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [notesByOpportunityId, setNotesByOpportunityId] = useState<Record<string, OpportunityNote[]>>({});
  const [loading, setLoading] = useState(true);

  const reloadOpportunities = useCallback(async () => {
    setLoading(true);
    try {
      const all: any[] = [];
      for (let page = 1; page <= OPPS_MAX_PAGES; page++) {
        const res = await api.get<any>(`/opportunities?page=${page}&limit=${OPPS_PAGE_LIMIT}`);

        const items = Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res?.data)
            ? res.data
            : Array.isArray(res)
              ? res
              : [];

        all.push(...items);

        const meta = res?.meta;
        const hasNext = typeof meta?.hasNext === 'boolean' ? meta.hasNext : items.length === OPPS_PAGE_LIMIT;
        if (!hasNext) break;
      }
      setOpportunities(all.map(mapOpportunity));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reloadOpportunities().catch(() => setLoading(false));
  }, [reloadOpportunities]);

  const getOpportunityById = useCallback(
    (id: string) => opportunities.find((o) => o.id === id),
    [opportunities]
  );

  const fetchOpportunityById = useCallback(async (id: string) => {
    const existing = getOpportunityById(id);
    if (existing) return existing;
    try {
      const doc = await api.get<any>(`/opportunities/${encodeURIComponent(id)}`);
      const mapped = mapOpportunity(doc);
      setOpportunities((prev) => {
        if (prev.some((o) => o.id === mapped.id)) return prev;
        return [mapped, ...prev];
      });
      return mapped;
    } catch {
      return undefined;
    }
  }, [getOpportunityById]);

  const upsertOpportunity = useCallback(async (id: string, patch: Partial<Opportunity>) => {
    const doc = await api.patch<any>(`/opportunities/${encodeURIComponent(id)}`, toCreatePayload(patch));
    const mapped = mapOpportunity(doc);
    setOpportunities((prev) => {
      const idx = prev.findIndex((o) => o.id === mapped.id);
      if (idx < 0) return [mapped, ...prev];
      const next = [...prev];
      next[idx] = mapped;
      return next;
    });
    return mapped;
  }, []);

  const createOpportunity = useCallback(async (patch: Partial<Opportunity>) => {
    const doc = await api.post<any>('/opportunities', toCreatePayload(patch));
    const mapped = mapOpportunity(doc);
    setOpportunities((prev) => [mapped, ...prev]);
    return mapped;
  }, []);

  const loadNotesForOpportunity = useCallback(async (opportunityId: string) => {
    const res = await api.get<any>(`/notes?opportunityId=${encodeURIComponent(opportunityId)}`);
    const items = Array.isArray(res?.items)
      ? res.items
      : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res)
          ? res
          : [];
    const mapped = items.map(mapNote);
    setNotesByOpportunityId((prev) => ({ ...prev, [opportunityId]: mapped }));
    return mapped;
  }, []);

  const addNote = useCallback(async (opportunityId: string, text: string, source: 'user' | 'ai' = 'user') => {
    const created = await api.post<any>('/notes', { opportunityId, text, source });
    const mapped = mapNote(created);
    setNotesByOpportunityId((prev) => {
      const current = prev[opportunityId] ?? [];
      return { ...prev, [opportunityId]: [mapped, ...current] };
    });
  }, []);

  const getNotesForOpportunity = useCallback(
    (id: string) => notesByOpportunityId[id] ?? [],
    [notesByOpportunityId]
  );

  const value = useMemo<OpportunitiesStore>(
    () => ({
      opportunities,
      notesByOpportunityId,
      loading,
      reloadOpportunities,
      fetchOpportunityById,
      upsertOpportunity,
      createOpportunity,
      addNote,
      loadNotesForOpportunity,
      getOpportunityById,
      getNotesForOpportunity,
    }),
    [
      opportunities,
      notesByOpportunityId,
      loading,
      reloadOpportunities,
      fetchOpportunityById,
      upsertOpportunity,
      createOpportunity,
      addNote,
      loadNotesForOpportunity,
      getOpportunityById,
      getNotesForOpportunity,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useOpportunitiesStore(): OpportunitiesStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('useOpportunitiesStore must be used within OpportunitiesProvider');
  return v;
}
