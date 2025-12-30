'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AIProvenanceIcon } from '@/components/ai/ai-provenance-icon';
import { useOpportunitiesStore } from '@/lib/opportunities-store';
import { useAbility } from '@/lib/ability';
import { useToast } from '@/hooks/use-toast';

export function OpportunityNotes({ opportunityId }: { opportunityId: string }) {
  const { toast } = useToast();
  const ability = useAbility();
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const canAdd = useMemo(() => value.trim().length > 0, [value]);
  const canCreate = ability.can('create', 'Note');

  const { addNote, getNotesForOpportunity, loadNotesForOpportunity } = useOpportunitiesStore();
  const notes = getNotesForOpportunity(opportunityId);

  useEffect(() => {
    loadNotesForOpportunity(opportunityId).catch(() => void 0);
  }, [loadNotesForOpportunity, opportunityId]);

  const handleAdd = async (source: 'user' | 'ai') => {
    if (!canAdd) return;
    if (!canCreate) {
      toast({ title: 'Not allowed', description: 'You do not have permission to add notes.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await addNote(opportunityId, value.trim(), source);
      setValue('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader>
        <CardTitle className="font-headline">Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Write a note…"
          className="min-h-24"
        />
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handleAdd('user')} disabled={!canAdd || saving || !canCreate}>
            Add note
          </Button>
          <Button variant="accent" onClick={() => handleAdd('ai')} disabled={!canAdd || saving || !canCreate}>
            <AIProvenanceIcon className="mr-2" /> Add as IA
          </Button>
        </div>

        {notes.length === 0 ? (
          <div className="rounded-2xl border bg-card p-3 text-sm text-muted-foreground">
            No notes yet. Add a note for the sales committee, next steps, risks, or decisions.
          </div>
        ) : (
          <div className="space-y-2">
            {notes.map((n) => (
              <div key={n.id} className="rounded-2xl border bg-card p-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(n.createdAtISO).toLocaleString()}</span>
                  {n.source === 'ai' ? (
                    <Badge variant="secondary" className="gap-1">
                      <AIProvenanceIcon /> IA
                    </Badge>
                  ) : (
                    <Badge variant="outline">User</Badge>
                  )}
                </div>
                <div className="mt-2 whitespace-pre-wrap text-sm">{n.text}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
