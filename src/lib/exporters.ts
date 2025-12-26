'use client';

import html2canvas from 'html2canvas';

/**
 * Export a DOM element as PNG.
 */
export async function exportElementAsPNG(element: HTMLElement, filename: string) {
  const canvas = await html2canvas(element, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
  });

  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  link.click();
}

/**
 * Export a DOM element as "PDF" using the browser print dialog.
 * Implementation: render to an image in a new window then trigger print.
 */
export async function exportElementAsPDF(element: HTMLElement, filename: string) {
  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
  });
  const dataUrl = canvas.toDataURL('image/png');

  const w = window.open('', '_blank');
  if (!w) return;

  w.document.write(`<!doctype html><html><head><title>${filename}</title>
    <style>html,body{margin:0;padding:0}img{width:100%;height:auto;}</style>
    </head><body>
    <img src="${dataUrl}" />
    <script>
      window.onload = () => { setTimeout(() => window.print(), 50); };
    </script>
    </body></html>`);
  w.document.close();
}

export function exportRowsAsCSV(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v);
    const escaped = s.replace(/"/g, '""');
    return `"${escaped}"`;
  };
  const lines = [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))];
  const csv = lines.join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportRowsAsXLSX(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([out], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
