'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, ApiError, setTokens, getTokens } from '@/lib/api-client';

export type PermissionAction = 'view' | 'create' | 'update' | 'delete' | 'manage';
export type PermissionSubject =
  | 'Dashboard'
  | 'Customer'
  | 'Opportunity'
  | 'Product'
  | 'File'
  | 'Note'
  | 'User'
  | 'Role'
  | 'all';

export type Permission = { subject: PermissionSubject | string; actions: (PermissionAction | string)[] };

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  roleName: string;
  photoURL?: string;
  bio?: string;
  permissions: Permission[];
};

type AuthState = {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (displayName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const Ctx = createContext<AuthState | null>(null);

function mapUserPayload(payload: any): AuthUser {
  // backend returns { user, roleName, permissions, accessToken, refreshToken }
  const u = payload?.user ?? payload;
  const id = u?.id ?? u?._id ?? u?.userId ?? u?.uid;
  const permsRaw = Array.isArray(payload?.permissions)
    ? payload.permissions
    : Array.isArray(u?.permissions)
      ? u.permissions
      : [];

  // Normalize to { subject, actions[] }
  const permissions: Permission[] = (Array.isArray(permsRaw) ? permsRaw : []).map((p: any) => {
    const subject = String(p?.subject ?? p?.module ?? '');
    const actions = Array.isArray(p?.actions)
      ? p.actions.map((x: any) => String(x))
      : p?.action
        ? [String(p.action)]
        : [];
    return { subject, actions } as any;
  }).filter((p: any) => p.subject);

  return {
    id: String(id),
    email: String(u?.email ?? ''),
    displayName: String(u?.displayName ?? u?.name ?? ''),
    roleName: String(payload?.roleName ?? u?.roleName ?? u?.role ?? ''),
    photoURL: u?.photoURL ? String(u.photoURL) : undefined,
    bio: u?.bio ? String(u.bio) : undefined,
    permissions,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const { accessToken, refreshToken } = getTokens();
    if (!accessToken && !refreshToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.get<{ user: any; roleName: string; permissions: Permission[] }>('/auth/me');
      setUser(mapUserPayload(res));
    } catch (e) {
      // Token invalid or server down
      setUser(null);
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        setTokens(null, null);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password }, { auth: false });
    setTokens(res.accessToken, res.refreshToken);
    setUser(mapUserPayload(res));
  }, []);

  const register = useCallback(async (displayName: string, email: string, password: string) => {
    const res = await api.post('/auth/register', { displayName, email, password }, { auth: false });
    setTokens(res.accessToken, res.refreshToken);
    setUser(mapUserPayload(res));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', {});
    } catch {
      // ignore
    }
    setTokens(null, null);
    setUser(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isLoading,
      login,
      register,
      logout,
      refreshMe,
    }),
    [user, isLoading, login, register, logout, refreshMe]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
