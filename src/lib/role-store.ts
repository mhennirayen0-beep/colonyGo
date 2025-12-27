'use client';

import type { Permission, PermissionAction, PermissionSubject } from '@/lib/auth-context';

export type RoleDef = {
  id: string;
  name: string; // roleName
  description?: string;
  permissions: Permission[];
};

const LS_ROLES = 'colonygo:roles';
const LS_CUSTOM_SUBJECTS = 'colonygo:aclSubjects';

export const SYSTEM_ROLE_NAMES = ['superadmin', 'admin', 'manager', 'sales'] as const;

export const ACL_SUBJECTS: { subject: PermissionSubject; label: string }[] = [
  { subject: 'Dashboard', label: 'Dashboard' },
  { subject: 'Customer', label: 'Customers' },
  { subject: 'Opportunity', label: 'Opportunities' },
  { subject: 'Product', label: 'Products' },
  { subject: 'File', label: 'Files' },
  { subject: 'Note', label: 'Notes' },
  { subject: 'User', label: 'Users' },
  { subject: 'Role', label: 'Roles' },
];

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
    ? base.map((x) => (x.subject.toLowerCase() === s.toLowerCase() ? { subject: s, label: String(label ?? x.label ?? s).trim() } : x))
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

export function getLocalRoles(): RoleDef[] {
  if (typeof window === 'undefined') return [];
  const parsed = safeParse<RoleDef[]>(window.localStorage.getItem(LS_ROLES));
  if (!parsed || !Array.isArray(parsed)) return [];
  return parsed.filter((r) => r && typeof r === 'object' && typeof r.name === 'string');
}

export function setLocalRoles(roles: RoleDef[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LS_ROLES, JSON.stringify(roles));
}

export function upsertLocalRole(role: RoleDef) {
  const roles = getLocalRoles();
  const idx = roles.findIndex((r) => r.id === role.id);
  const next = idx >= 0 ? roles.map((r, i) => (i === idx ? role : r)) : [role, ...roles];
  setLocalRoles(next);
  return next;
}

export function deleteLocalRole(roleId: string) {
  const roles = getLocalRoles();
  const next = roles.filter((r) => r.id !== roleId);
  setLocalRoles(next);
  return next;
}
