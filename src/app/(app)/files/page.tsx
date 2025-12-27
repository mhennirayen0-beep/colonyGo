'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Upload } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api-client';
import { useAbility } from '@/lib/ability';

type FileRow = {
  fileid: string;
  filename: string;
  fileuploaddate: string;
  fileref: string;
  filetype: string;
  fileurl: string;
  size?: number;
  mimeType?: string;
};

export default function FilesPage() {
  const { toast } = useToast();
  const ability = useAbility();
  const [ref, setRef] = useState('');
  const [rows, setRows] = useState<FileRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const canView = ability.can('view', 'File');
  const canCreate = ability.can('create', 'File');

  const load = async (r: string) => {
    if (!r) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.get(`/files?fileref=${encodeURIComponent(r)}`);
      setRows(Array.isArray(data) ? (data as any) : []);
    } catch (e: any) {
      toast({ title: 'Failed to load files', description: e?.message ?? 'Error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // no auto-load
  }, []);

  const handleUpload = async () => {
    if (!canCreate) {
      toast({ title: 'Not allowed', description: 'You do not have permission to upload files.', variant: 'destructive' });
      return;
    }
    if (!ref.trim()) {
      toast({ title: 'Missing reference', description: 'Please enter a file reference (e.g., OPP-00001).', variant: 'destructive' });
      return;
    }
    if (!file) {
      toast({ title: 'No file', description: 'Choose a file first.', variant: 'destructive' });
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    fd.append('fileref', ref.trim());
    fd.append('filetype', 'general');
    try {
      setLoading(true);
      await api.post('/files/upload', fd);
      toast({ title: 'Uploaded', description: 'File uploaded successfully.' });
      setFile(null);
      await load(ref.trim());
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e?.message ?? 'Error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const canDownload = useMemo(() => canView, [canView]);

  if (!canView) {
    return (
      <div className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">
        You are not authorized to view files.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-headline font-bold text-primary">Files</h1>
        <p className="text-muted-foreground">Search files by reference (e.g., an opportunity ID) and upload new ones.</p>
      </div>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">Search & Upload</CardTitle>
          <CardDescription>Files are stored against a reference string (fileref).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="ref">Reference (fileref)</Label>
              <Input id="ref" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="OPP-00001" />
            </div>
            <div className="flex items-end gap-2">
              <Button variant="outline" onClick={() => load(ref.trim())} disabled={loading}>
                {loading ? 'Loading…' : 'Load'}
              </Button>
              <Button variant="secondary" onClick={() => { setRef(''); setRows([]); }} disabled={loading}>
                Clear
              </Button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="file">Upload</Label>
              <Input
                id="file"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={!canCreate || loading}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleUpload} variant="accent" disabled={!canCreate || loading} className="w-full">
                <Upload className="mr-2 h-4 w-4" /> Upload
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-sm">
        <CardHeader>
          <CardTitle className="font-headline">Results</CardTitle>
          <CardDescription>{rows.length ? `${rows.length} file(s)` : 'No files loaded yet.'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Filename</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.fileid}>
                    <TableCell className="font-mono text-xs">{r.fileid}</TableCell>
                    <TableCell>{r.filename}</TableCell>
                    <TableCell>{r.filetype}</TableCell>
                    <TableCell>{new Date(r.fileuploaddate).toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!canDownload}
                        onClick={() => window.open(r.fileurl, '_blank')}
                      >
                        <Download className="mr-2 h-4 w-4" /> Download
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!rows.length ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                      {loading ? 'Loading…' : 'No files to show.'}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
