import { InvoiceDetailClient } from './ui';

export default function InvoiceDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <InvoiceDetailClient invoiceId={decodeURIComponent(params.id)} />;
}
