import { InvoicePrintClient } from './ui';

export default function InvoicePrintPage({
  params,
}: {
  params: { id: string };
}) {
  return <InvoicePrintClient invoiceId={decodeURIComponent(params.id)} />;
}
