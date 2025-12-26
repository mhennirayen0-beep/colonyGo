'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { exportRowsAsCSV, exportRowsAsXLSX, exportElementAsPDF } from '@/lib/exporters';

type ExportMenuProps = {
  label?: string;
  filename: string;
  rows: Record<string, any>[];
  pdfElementId?: string;
};

export function ExportMenu({ label = 'Export', filename, rows, pdfElementId }: ExportMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => exportRowsAsCSV(rows, filename)}>
          CSV
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => exportRowsAsXLSX(rows, filename)}>
          Excel (XLSX)
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            if (!pdfElementId) return;
            const el = document.getElementById(pdfElementId);
            if (!el) return;
            await exportElementAsPDF(el, `${filename}.pdf`);
          }}
        >
          PDF (Print)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
