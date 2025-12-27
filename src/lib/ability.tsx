'use client';

import React, { createContext, useContext, useMemo } from 'react';
import type { AuthUser, Permission } from '@/lib/auth-context';

export type Ability = {
  can: (action: string, subject: string) => boolean;
  roleName: string | null;
};

function normalizeAction(a: string) {
  const x = String(a || '').toLowerCase();
  if (x === 'read') return 'view';
  if (x === 'write') return 'update';
  return x;
}

function normalizeSubject(s: string) {
  const x = String(s || '').trim();
  if (!x) return '';
  // tolerate lower/upper
  return x === '*' ? 'all' : x;
}

function subjectMatches(rule: Permission, subject: string) {
  const rSubject = normalizeSubject(String(rule.subject));
  if (rSubject.toLowerCase() === 'all') return true;
  if (rSubject.toLowerCase() === subject.toLowerCase()) return true;
  return false;
}

export function buildAbility(user: AuthUser | null): Ability {
  const roleName = user?.roleName ?? null;
  const perms = Array.isArray(user?.permissions) ? user!.permissions : [];

  const can = (actionRaw: string, subjectRaw: string) => {
    const action = normalizeAction(actionRaw);
    const subject = normalizeSubject(subjectRaw);

    // Superadmin override
    if ((roleName || '').toLowerCase() === 'superadmin') return true;

    // No perms means deny by default
    if (!perms.length) return false;

    const want = normalizeAction(action);
    const CRUD = ['view', 'create', 'update', 'delete'];

    for (const p of perms) {
      if (!subjectMatches(p, subject)) continue;
      const actions = Array.isArray((p as any).actions) ? (p as any).actions : [];
      const norm = actions.map((x: any) => normalizeAction(String(x)));

      if (norm.includes('manage')) return true;

      if (want === 'manage') {
        // treat manage as having all CRUD actions
        if (CRUD.every((a) => norm.includes(a))) return true;
        continue;
      }

      if (norm.includes(want)) return true;
    }

    return false;
  };

  return { can, roleName };
}

const AbilityCtx = createContext<Ability | null>(null);

export function AbilityProvider({ user, children }: { user: AuthUser | null; children: React.ReactNode }) {
  const value = useMemo(() => buildAbility(user), [user]);
  return <AbilityCtx.Provider value={value}>{children}</AbilityCtx.Provider>;
}

export function useAbility() {
  const ctx = useContext(AbilityCtx);
  if (!ctx) throw new Error('useAbility must be used within AbilityProvider');
  return ctx;
}
