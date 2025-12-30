import { CrmClientPage } from './crm-client-page';

export default function CrmPage({
  searchParams,
}: {
  searchParams?: { mode?: string };
}) {
  const mode = searchParams?.mode === 'view' ? 'view' : 'data';
  return <CrmClientPage mode={mode} />;
}
