import { QuotePrintClient } from './ui';

export default function QuotePrintPage({
  params,
}: {
  params: { id: string };
}) {
  return <QuotePrintClient quoteId={decodeURIComponent(params.id)} />;
}
