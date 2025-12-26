'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { exportElementAsPDF, exportElementAsPNG, exportRowsAsCSV, exportRowsAsXLSX } from '@/lib/exporters';

type Props = {
  /** optional data export */
  rows?: Record<string, any>[];
  filenameBase: string;
  /** optional DOM export */
  element?: HTMLElement | null;
};

export function ExportActions({ rows, filenameBase, element }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {rows && rows.length > 0 && (
        <>
          <Button variant="secondary" size="sm" onClick={() => exportRowsAsCSV(rows, `${filenameBase}.csv`)}>
            <Download className="mr-2 h-4 w-4" />
            CSV
          </Button>
          <Button variant="secondary" size="sm" onClick={() => exportRowsAsXLSX(rows, `${filenameBase}.xlsx`)}>
            <Download className="mr-2 h-4 w-4" />
            Excel
          </Button>
        </>
      )}
      {element && (
        <>
          <Button variant="secondary" size="sm" onClick={() => exportElementAsPNG(element, `${filenameBase}.png`)}>
            <Download className="mr-2 h-4 w-4" />
            PNG
          </Button>
          <Button variant="secondary" size="sm" onClick={() => exportElementAsPDF(element, `${filenameBase}.pdf`)}>
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>
        </>
      )}
    </div>
  );
}
