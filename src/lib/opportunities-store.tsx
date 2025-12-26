'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Opportunity } from '@/lib/types';
import { opportunities as seedOpportunities, customers } from '@/lib/data';

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
};

type OpportunitiesStore = OpportunitiesState & {
  upsertOpportunity: (id: string, patch: Partial<Opportunity>) => void;
  createOpportunity: (patch: Partial<Opportunity>) => Opportunity;
  addNote: (opportunityId: string, text: string, source?: 'user' | 'ai') => void;
  getOpportunityById: (id: string) => Opportunity | undefined;
  getNotesForOpportunity: (id: string) => OpportunityNote[];
};

const LS_KEY_OPPS = 'colonygo:opportunities';
const LS_KEY_NOTES = 'colonygo:opportunity_notes';

const Ctx = createContext<OpportunitiesStore | null>(null);

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function hydrateOpportunityNames(opps: Opportunity[]): Opportunity[] {
  // Ensure customername is consistent after edits (customerid -> customername)
  const customerById = new Map(customers.map((c) => [c.id, c.name] as const));
  return opps.map((o) => ({
    ...o,
    customername: customerById.get(o.customerid) ?? o.customername,
  }));
}

export function OpportunitiesProvider({ children }: { children: React.ReactNode }) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>(seedOpportunities);
  const [notesByOpportunityId, setNotesByOpportunityId] = useState<Record<string, OpportunityNote[]>>({});

  // Load persisted state
  useEffect(() => {
    const persistedOpps = safeJsonParse<Opportunity[]>(typeof window !== 'undefined' ? window.localStorage.getItem(LS_KEY_OPPS) : null);
    if (persistedOpps && Array.isArray(persistedOpps) && persistedOpps.length) {
      setOpportunities(hydrateOpportunityNames(persistedOpps));
    }

    const persistedNotes = safeJsonParse<Record<string, OpportunityNote[]>>(
      typeof window !== 'undefined' ? window.localStorage.getItem(LS_KEY_NOTES) : null
    );
    if (persistedNotes && typeof persistedNotes === 'object') {
      setNotesByOpportunityId(persistedNotes);
    }
  }, []);

  // Persist opportunities
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LS_KEY_OPPS, JSON.stringify(opportunities));
  }, [opportunities]);

  // Persist notes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LS_KEY_NOTES, JSON.stringify(notesByOpportunityId));
  }, [notesByOpportunityId]);

  const getOpportunityById = useCallback(
    (id: string) => opportunities.find((o) => o.id === id),
    [opportunities]
  );

  const upsertOpportunity = useCallback((id: string, patch: Partial<Opportunity>) => {
    setOpportunities((prev) => {
      const idx = prev.findIndex((o) => o.id === id);
      if (idx < 0) return prev;
      const updated: Opportunity = { ...prev[idx], ...patch };
      const next = [...prev];
      next[idx] = hydrateOpportunityNames([updated])[0]!;
      return next;
    });
  }, []);

  const createOpportunity = useCallback((patch: Partial<Opportunity>) => {
    const id = patch.id ?? `OPP-${Date.now()}`;
    const base: Opportunity = {
      id,
      createdAtISO: new Date().toISOString(),
      opportunityname: patch.opportunityname ?? 'New Opportunity',
      opportunitydescription: patch.opportunitydescription ?? '',
      customerid: patch.customerid ?? customers[0]?.id ?? 'CS-UNKNOWN',
      customername: patch.customername ?? customers[0]?.name ?? 'Unknown',
      opportunitystatut: (patch.opportunitystatut as Opportunity['opportunitystatut']) ?? 'Forecast',
      opportunityphase: (patch.opportunityphase as Opportunity['opportunityphase']) ?? 'Prospection',
      hardware_price: Number(patch.hardware_price ?? 0),
      software_price: Number(patch.software_price ?? 0),
      service_price: Number(patch.service_price ?? 0),
      opportunityowner: patch.opportunityowner ?? '—',
      swot_strength: Number(patch.swot_strength ?? 0),
      swot_weakness: Number(patch.swot_weakness ?? 0),
      swot_opportunities: Number(patch.swot_opportunities ?? 0),
      swot_threats: Number(patch.swot_threats ?? 0),
      value_forecast: Number(patch.value_forecast ?? 0),
      value_final: Number(patch.value_final ?? 0),
      value_discount: Number(patch.value_discount ?? 0),
      value_budget: Number(patch.value_budget ?? 0),
      value_customer: Number(patch.value_customer ?? 0),
      value_bonus: Number(patch.value_bonus ?? 0),
      opportunityscl: patch.opportunityscl ?? '',
      ownerDetails: patch.ownerDetails,
    };

    const created = hydrateOpportunityNames([base])[0]!;
    setOpportunities((prev) => [created, ...prev]);
    return created;
  }, []);

  const addNote = useCallback((opportunityId: string, text: string, source: 'user' | 'ai' = 'user') => {
    const note: OpportunityNote = {
      id: `note-${Date.now()}`,
      opportunityId,
      text,
      createdAtISO: new Date().toISOString(),
      source,
    };
    setNotesByOpportunityId((prev) => {
      const current = prev[opportunityId] ?? [];
      return {
        ...prev,
        [opportunityId]: [note, ...current],
      };
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
      upsertOpportunity,
      createOpportunity,
      addNote,
      getOpportunityById,
      getNotesForOpportunity,
    }),
    [
      opportunities,
      notesByOpportunityId,
      upsertOpportunity,
      createOpportunity,
      addNote,
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
