'use client';

import { useEffect, useMemo, useState } from 'react';
import { PlusCircle, ShieldAlert, Trash2, Pencil } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useAbility } from '@/lib/ability';
import type { Permission } from '@/lib/auth-context';
import { ACL_ACTIONS, ACL_SUBJECTS, addCustomAclSubject, deleteCustomAclSubject, getCustomAclSubjects, deleteLocalRole, getLocalRoles, upsertLocalRole, type AclSubjectDef, type RoleDef } from '@/lib/role-store';

function newId() {
  return `role_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function hasPerm(perms: Permission[], subject: string, action: string) {
  const s = subject.toLowerCase();
  const a = action.toLowerCase();
  return perms.some((p) => {
    if (String(p.subject).toLowerCase() !== s) return false;
    const acts = Array.isArray((p as any).actions) ? (p as any).actions : [];
    return acts.map((x: any) => String(x).toLowerCase()).includes(a);
  });
}

export default function RoleManagementPage() {
  const ability = useAbility();
  const { toast } = useToast();

  const canManage = ability.roleName?.toLowerCase() === 'superadmin' || (ability.can('manage', 'Role') && ability.can('manage', 'User'));

  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [customSubjects, setCustomSubjects] = useState<AclSubjectDef[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RoleDef | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);

  const [newSubject, setNewSubject] = useState('');
  const [newSubjectLabel, setNewSubjectLabel] = useState('');

  useEffect(() => {
    setRoles(getLocalRoles());
    setCustomSubjects(getCustomAclSubjects());
  }, []);

  const subjectRows = useMemo(() => {
    const base = ACL_SUBJECTS.map((s) => ({ subject: s.subject as string, label: s.label, system: true }));
    const custom = customSubjects.map((s) => ({ subject: s.subject, label: s.label, system: false }));
    // de-dup (custom overrides label if same subject)
    const map = new Map<string, { subject: string; label: string; system: boolean }>();
    [...custom, ...base].forEach((x) => map.set(x.subject.toLowerCase(), x));
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [customSubjects]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPermissions([]);
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (r: RoleDef) => {
    setEditing(r);
    setName(r.name);
    setDescription(r.description ?? '');
    setPermissions(r.permissions ?? []);
    setOpen(true);
  };

  const onToggle = (subject: string, action: string, checked: boolean) => {
    setPermissions((prev) => {
      const subj = subject.trim();
      const act = action.trim();
      const idx = prev.findIndex((p) => String(p.subject).toLowerCase() === subj.toLowerCase());
      const copy = [...prev];
      const current = idx >= 0 ? copy[idx] : ({ subject: subj, actions: [] } as any);
      const acts = new Set<string>((Array.isArray((current as any).actions) ? (current as any).actions : []).map((x: any) => String(x)));

      if (checked) acts.add(act);
      else acts.delete(act);

      const nextActs = Array.from(acts);
      if (nextActs.length === 0) {
        if (idx >= 0) copy.splice(idx, 1);
        return copy;
      }

      const updated = { ...(current as any), subject: subj, actions: nextActs } as any;
      if (idx >= 0) copy[idx] = updated;
      else copy.push(updated);
      return copy;
    });
  };

  const save = () => {
    if (!name.trim()) {
      toast({ title: 'Role name is required', variant: 'destructive' });
      return;
    }
    const role: RoleDef = {
      id: editing?.id ?? newId(),
      name: name.trim().toLowerCase(),
      description: description.trim() || undefined,
      permissions,
    };
    const next = upsertLocalRole(role);
    setRoles(next);
    toast({ title: editing ? 'Role updated' : 'Role created', description: role.name });
    setOpen(false);
    resetForm();
  };

  const remove = (id: string) => {
    const next = deleteLocalRole(id);
    setRoles(next);
    toast({ title: 'Role deleted' });
  };

  const addSubject = () => {
    const subject = newSubject.trim();
    if (!subject) {
      toast({ title: 'Screen key is required', description: 'Example: PurchaseOrder or Inventory', variant: 'destructive' });
      return;
    }
    const next = addCustomAclSubject(subject, newSubjectLabel.trim() || undefined);
    setCustomSubjects(next);
    setNewSubject('');
    setNewSubjectLabel('');
    toast({ title: 'Screen added', description: subject });
  };

  const removeSubject = (subject: string) => {
    const next = deleteCustomAclSubject(subject);
    setCustomSubjects(next);
    toast({ title: 'Screen removed', description: subject });
  };

  const rolesCount = useMemo(() => roles.length, [roles]);

  if (!canManage) {
    return (
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Not allowed</CardTitle>
          <CardDescription>You don&apos;t have permission to manage roles.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">Role Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create roles and assign screen permissions (view / create / edit / delete).</p>
        </div>
        <Button variant="accent" onClick={openCreate}>
          <PlusCircle className="mr-2 h-4 w-4" /> New Role
        </Button>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">Screens / Permissions catalog</CardTitle>
          <CardDescription>
            Add custom screens (subjects) so you can assign permissions to new modules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="subKey">Screen key</Label>
              <Input
                id="subKey"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="e.g. PurchaseOrder"
              />
              <p className="text-xs text-muted-foreground">Used in code: ability.can('view', 'PurchaseOrder')</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subLabel">Label</Label>
              <Input
                id="subLabel"
                value={newSubjectLabel}
                onChange={(e) => setNewSubjectLabel(e.target.value)}
                placeholder="e.g. Purchase Orders"
              />
            </div>
            <div className="flex items-end">
              <Button variant="accent" onClick={addSubject}>Add screen</Button>
            </div>
          </div>

          {customSubjects.length > 0 && (
            <div className="rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Screen key</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customSubjects.map((s) => (
                    <TableRow key={s.subject}>
                      <TableCell className="font-medium">{s.subject}</TableCell>
                      <TableCell>{s.label}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="destructive" size="sm" onClick={() => removeSubject(s.subject)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">Roles</CardTitle>
          <CardDescription>{rolesCount} custom roles stored locally (backend sync comes in part 2).</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-sm text-muted-foreground">No custom roles yet.</TableCell>
                </TableRow>
              ) : (
                roles.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell>{r.description ?? '—'}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.permissions?.length ? `${r.permissions.length} rules` : '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEdit(r)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => remove(r.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">Permission catalog</CardTitle>
          <CardDescription>
            Add extra screens/modules so you can assign permissions for them. (This is frontend-local for now; backend sync comes in part 2.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="subKey">Screen key</Label>
              <Input
                id="subKey"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="e.g. PurchaseOrder"
              />
              <p className="text-xs text-muted-foreground">Used internally in permissions (subject).</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="subLabel">Label</Label>
              <Input
                id="subLabel"
                value={newSubjectLabel}
                onChange={(e) => setNewSubjectLabel(e.target.value)}
                placeholder="e.g. Purchase Orders"
              />
              <p className="text-xs text-muted-foreground">What you see in the UI table.</p>
            </div>
            <div className="flex items-end">
              <Button variant="accent" onClick={addSubject} className="w-full">Add screen</Button>
            </div>
          </div>

          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Custom screen</TableHead>
                  <TableHead>Label</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customSubjects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-sm text-muted-foreground">
                      No custom screens yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  customSubjects.map((s) => (
                    <TableRow key={s.subject}>
                      <TableCell className="font-medium">{s.subject}</TableCell>
                      <TableCell>{s.label}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="destructive" size="sm" onClick={() => removeSubject(s.subject)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Remove
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit role' : 'New role'}</DialogTitle>
            <DialogDescription>Define the role and select permissions by screen.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="roleName">Role name</Label>
              <Input id="roleName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. sales" />
              <p className="text-xs text-muted-foreground">Tip: keep it lowercase to match backend roleName.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="roleDesc">Description</Label>
              <Input id="roleDesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Screen</TableHead>
                  {ACL_ACTIONS.map((a) => (
                    <TableHead key={a.action} className="text-center">{a.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjectRows.map((s) => (
                  <TableRow key={s.subject}>
                    <TableCell className="font-medium">{s.label}</TableCell>
                    {ACL_ACTIONS.map((a) => {
                      const checked = hasPerm(permissions, s.subject, a.action);
                      return (
                        <TableCell key={a.action} className="text-center">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) => onToggle(s.subject, a.action, Boolean(v))}
                          />
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
            <Button variant="accent" onClick={save}>Save role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
