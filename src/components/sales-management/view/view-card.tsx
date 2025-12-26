'use client';

import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { exportElementAsPNG, exportElementAsPDF } from '@/lib/exporters';

export function ViewCard({ id, title, subtitle, children }: { id: string; title: string; subtitle?: string; children: ReactNode }) {
  return (
    <Card id={id} className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="font-headline">{title}</CardTitle>
          {subtitle ? <div className="mt-1 text-sm text-muted-foreground">{subtitle}</div> : null}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const el = document.getElementById(id);
              if (!el) return;
              await exportElementAsPNG(el, `${id}.png`);
            }}
          >
            <FileDown className="mr-2 h-4 w-4" />
            PNG
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const el = document.getElementById(id);
              if (!el) return;
              await exportElementAsPDF(el, `${id}.pdf`);
            }}
          >
            <FileDown className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-0">{children}</CardContent>
    </Card>
  );
}
