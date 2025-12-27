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
    id: String(doc?.opportunityId ?? doc?.id ?? ''),
    createdAtISO: doc?.createdAt ? String(doc.createdAt) : new Date().toISOString(),
    opportunityname: String(doc?.opportunityName ?? doc?.opportunityname ?? ''),
    opportunitydescription: String(doc?.opportunityDescription ?? doc?.opportunitydescription ?? ''),
    customerid: String(doc?.customerId ?? doc?.customerid ?? ''),
    customername: String(doc?.customerName ?? doc?.customername ?? doc?.customerId ?? ''),
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
  return {
    opportunityName: patch.opportunityname,
    opportunityDescription: patch.opportunitydescription,
    customerId: patch.customerid,
    statut: patch.opportunitystatut,
    phase: patch.opportunityphase,
    hardwarePrice: patch.hardware_price,
    softwarePrice: patch.software_price,
    servicePrice: patch.service_price,
    opportunityOwner: patch.opportunityowner,
    swotStrength: patch.swot_strength,
    swotWeakness: patch.swot_weakness,
    swotOpportunities: patch.swot_opportunities,
    swotThreats: patch.swot_threats,
    valueForecast: patch.value_forecast,
    valueFinal: patch.value_final,
    valueDiscount: patch.value_discount,
    valueBudget: patch.value_budget,
    valueCustomer: patch.value_customer,
    valueBonus: patch.value_bonus,
    opportunityScl: patch.opportunityscl,
  };
}

function mapNote(doc: any): OpportunityNote {
  return {
    id: String(doc?.noteId ?? doc?.id ?? doc?._id ?? ''),
    opportunityId: String(doc?.opportunityId ?? ''),
    text: String(doc?.text ?? ''),
    createdAtISO: doc?.createdAt ? String(doc.createdAt) : new Date().toISOString(),
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
      const res = await api.get<any>('/opportunities');
      const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
      setOpportunities(items.map(mapOpportunity));
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
    const items = Array.isArray(res?.items) ? res.items : Array.isArray(res) ? res : [];
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
