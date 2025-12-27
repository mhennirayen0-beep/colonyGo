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

function ruleMatches(rule: Permission, action: string, subject: string) {
  const rAction = normalizeAction(String(rule.action));
  const rSubject = normalizeSubject(String(rule.subject));
  if (rSubject === 'all') return true;
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

    for (const p of perms) {
      const a = normalizeAction(String(p.action));
      if (!ruleMatches(p, action, subject)) continue;
      if (a === 'manage') return true;
      if (a === action) return true;
      // manage implies everything, also allow view if manage was set on subject
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
