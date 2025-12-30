import { QuoteDetailClient } from './ui';

export default function QuoteDetailPage({
  params,
}: {
  params: { id: string };
}) {
  return <QuoteDetailClient quoteId={decodeURIComponent(params.id)} />;
}
