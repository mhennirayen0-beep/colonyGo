'use client';

import { useEffect, useMemo, useState } from 'react';
import { PlusCircle, ShieldAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api-client';
import { useAbility } from '@/lib/ability';
import { getLocalRoles, SYSTEM_ROLE_NAMES } from '@/lib/role-store';

type UserRow = {
  id: string;
  displayName: string;
  email: string;
  roleName: string;
  createdAt?: string;
};

function asUserRow(u: any): UserRow {
  return {
    id: String(u?.id ?? u?._id ?? ''),
    displayName: String(u?.displayName ?? ''),
    email: String(u?.email ?? ''),
    roleName: String(u?.roleName ?? u?.role ?? ''),
    createdAt: u?.createdAt ? String(u.createdAt) : undefined,
  };
}

export default function UserManagementPage() {
  const ability = useAbility();
  const { toast } = useToast();

  const canManage = ability.roleName?.toLowerCase() === 'superadmin' || ability.can('manage', 'User');

  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleName, setRoleName] = useState('sales');

  const roleOptions = useMemo(() => {
    const local = getLocalRoles().map((r) => r.name);
    const all = Array.from(new Set([...SYSTEM_ROLE_NAMES, ...local].map((x) => String(x).toLowerCase())));
    return all;
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get<{ items: any[] }>('/users');
      const items = Array.isArray((res as any).items) ? (res as any).items : Array.isArray(res as any) ? (res as any) : [];
      setUsers(items.map(asUserRow));
    } catch (err: any) {
      toast({ title: 'Failed to load users', description: err?.message ? String(err.message) : undefined, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!canManage) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canManage]);

  const create = async () => {
    if (!displayName.trim() || !email.trim() || !password.trim()) {
      toast({ title: 'Missing fields', description: 'Please fill display name, email and password.', variant: 'destructive' });
      return;
    }
    try {
      await api.post('/users', { displayName, email, password, roleName });
      toast({ title: 'User created' });
      setOpen(false);
      setDisplayName('');
      setEmail('');
      setPassword('');
      setRoleName('sales');
      load();
    } catch (err: any) {
      toast({ title: 'Failed to create user', description: err?.message ? String(err.message) : undefined, variant: 'destructive' });
    }
  };

  const updateRole = async (userId: string, nextRole: string) => {
    try {
      await api.patch(`/users/${encodeURIComponent(userId)}`, { roleName: nextRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, roleName: nextRole } : u)));
      toast({ title: 'Role updated' });
    } catch (err: any) {
      toast({ title: 'Failed to update role', description: err?.message ? String(err.message) : undefined, variant: 'destructive' });
    }
  };

  if (!canManage) {
    return (
      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2"><ShieldAlert className="h-5 w-5" /> Not allowed</CardTitle>
          <CardDescription>You don&apos;t have permission to manage users.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-headline font-bold text-primary">User Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create users and assign roles.</p>
        </div>
        <Button variant="accent" onClick={() => setOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> New User
        </Button>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">Users</CardTitle>
          <CardDescription>{loading ? 'Loading…' : `${users.length} users`}</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-sm text-muted-foreground">No users.</TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.displayName}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>
                      <Select value={u.roleName} onValueChange={(v) => updateRole(u.id, v)}>
                        <SelectTrigger className="w-[200px]">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>New user</DialogTitle>
            <DialogDescription>Create a user and assign a role.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="uName">Display name</Label>
              <Input id="uName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="uEmail">Email</Label>
              <Input id="uEmail" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="uPass">Password</Label>
              <Input id="uPass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Role</Label>
              <Select value={roleName} onValueChange={setRoleName}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="accent" onClick={create}>Create user</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
