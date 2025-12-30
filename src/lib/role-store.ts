'use client';

// Part B: backend-synced roles/permissions.
// Roles are persisted in MongoDB via NestJS (/roles).
// The screens catalog remains frontend-driven (from APP_SCREENS) + optional local custom subjects.

import { api } from '@/lib/api-client';
import type { Permission, PermissionAction } from '@/lib/auth-context';
import { APP_SCREENS } from '@/config/screens';

export type RoleDef = {
  id: string;
  name: string; // roleName
  description?: string;
  isSystem?: boolean;
  permissions: Permission[];
};

const LS_CUSTOM_SUBJECTS = 'colonygo:aclSubjects';

export const SYSTEM_ROLE_NAMES = ['superadmin', 'admin', 'manager', 'sales'] as const;

// Screens catalog used by Role Management.
export const ACL_SUBJECTS: { subject: string; label: string }[] = APP_SCREENS
  .map((s) => ({ subject: s.subject, label: s.label }))
  // de-dup by subject (case-insensitive)
  .reduce((acc: { subject: string; label: string }[], cur) => {
    const exists = acc.some((x) => x.subject.toLowerCase() === cur.subject.toLowerCase());
    if (!exists) acc.push(cur);
    return acc;
  }, [])
  .sort((a, b) => a.label.localeCompare(b.label));

export type AclSubjectDef = { subject: string; label: string };

export const ACL_ACTIONS: { action: PermissionAction; label: string }[] = [
  { action: 'view', label: 'View' },
  { action: 'create', label: 'Create' },
  { action: 'update', label: 'Edit' },
  { action: 'delete', label: 'Delete' },
];

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ---------- Custom subjects (still local) ----------
export function getCustomAclSubjects(): AclSubjectDef[] {
  if (typeof window === 'undefined') return [];
  const parsed = safeParse<AclSubjectDef[]>(window.localStorage.getItem(LS_CUSTOM_SUBJECTS));
  if (!parsed || !Array.isArray(parsed)) return [];
  return parsed
    .filter((x) => x && typeof x === 'object' && typeof (x as any).subject === 'string')
    .map((x: any) => ({ subject: String(x.subject).trim(), label: String(x.label ?? x.subject).trim() }))
    .filter((x) => x.subject);
}

export function setCustomAclSubjects(subjects: AclSubjectDef[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LS_CUSTOM_SUBJECTS, JSON.stringify(subjects));
}

export function addCustomAclSubject(subject: string, label?: string) {
  const s = String(subject || '').trim();
  if (!s) return getCustomAclSubjects();
  const base = getCustomAclSubjects();
  const exists = base.some((x) => x.subject.toLowerCase() === s.toLowerCase());
  const next = exists
    ? base.map((x) =>
        x.subject.toLowerCase() === s.toLowerCase()
          ? { subject: s, label: String(label ?? x.label ?? s).trim() }
          : x,
      )
    : [{ subject: s, label: String(label ?? s).trim() }, ...base];
  setCustomAclSubjects(next);
  return next;
}

export function deleteCustomAclSubject(subject: string) {
  const s = String(subject || '').trim().toLowerCase();
  const base = getCustomAclSubjects();
  const next = base.filter((x) => x.subject.toLowerCase() !== s);
  setCustomAclSubjects(next);
  return next;
}

// ---------- Backend-synced roles ----------

function normalizeRole(r: any): RoleDef {
  return {
    id: String(r?.id ?? r?._id ?? ''),
    name: String(r?.name ?? '').toLowerCase(),
    description: r?.description ? String(r.description) : undefined,
    isSystem: !!r?.isSystem,
    permissions: Array.isArray(r?.permissions) ? (r.permissions as Permission[]) : [],
  };
}

export async function listRoles(): Promise<RoleDef[]> {
  const res = await api.get<any>('/roles');
  const items = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
  return items.map(normalizeRole);
}

export async function createRole(payload: Omit<RoleDef, 'id'>): Promise<{ id: string }> {
  const body = {
    name: payload.name,
    description: payload.description ?? '',
    permissions: payload.permissions ?? [],
  };
  const res = await api.post<any>('/roles', body);
  return { id: String(res?.id ?? '') };
}

export async function updateRole(id: string, payload: Partial<Omit<RoleDef, 'id'>>): Promise<{ id: string }> {
  const body: any = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.description !== undefined) body.description = payload.description;
  if (payload.permissions !== undefined) body.permissions = payload.permissions;
  const res = await api.patch<any>(`/roles/${encodeURIComponent(id)}`, body);
  return { id: String(res?.id ?? id) };
}

export async function deleteRole(id: string): Promise<void> {
  await api.delete(`/roles/${encodeURIComponent(id)}`);
}
