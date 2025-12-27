'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api-client';
import { useAbility } from '@/lib/ability';

type NoteRow = {
  id: string;
  opportunityId: string;
  text: string;
  createdAtISO: string;
  source: 'user' | 'ai';
};

export default function NotesPage() {
  const { toast } = useToast();
  const ability = useAbility();
  const [opportunityId, setOpportunityId] = useState('');
  const [rows, setRows] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(false);

  const canView = ability.can('view', 'Note');

  const load = async () => {
    if (!opportunityId.trim()) {
      toast({ title: 'Missing ID', description: 'Enter an opportunity ID (e.g., OPP-00001).', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const data = await api.get(`/notes?opportunityId=${encodeURIComponent(opportunityId.trim())}`);
      setRows(Array.isArray(data) ? (data as any) : []);
    } catch (e: any) {
      toast({ title: 'Failed to load notes', description: e?.message ?? 'Error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (!canView) {
    return (
      <div className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
        You are not authorized to view notes.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary">Notes</h1>
        <p className="text-muted-foreground">Notes are stored per opportunity. Search by opportunity ID.</p>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">Search</CardTitle>
          <CardDescription>Example: OPP-00001</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-end">
          <div className="w-full space-y-2">
            <Label htmlFor="oppId">Opportunity ID</Label>
            <Input id="oppId" value={opportunityId} onChange={(e) => setOpportunityId(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Button variant="accent" onClick={load} disabled={loading}>
              {loading ? 'Loading…' : 'Load'}
            </Button>
            <Button variant="outline" onClick={() => { setOpportunityId(''); setRows([]); }} disabled={loading}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">Results</CardTitle>
          <CardDescription>{rows.length ? `${rows.length} note(s)` : 'No notes loaded yet.'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rows.map((n) => (
              <div key={n.id} className="rounded-2xl border bg-card p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    {new Date(n.createdAtISO).toLocaleString()} · {n.source}
                  </div>
                  <div className="text-xs font-mono text-muted-foreground">{n.opportunityId}</div>
                </div>
                <div className="mt-2 text-sm">{n.text}</div>
              </div>
            ))}

            {!rows.length ? (
              <div className="text-sm text-muted-foreground">{loading ? 'Loading…' : 'No notes to show.'}</div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
