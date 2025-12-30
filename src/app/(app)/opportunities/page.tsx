import { OpportunitiesClientPage } from './opportunities-client-page';

export default function OpportunitiesPage({
  searchParams,
}: {
  searchParams?: {
    mode?: string;
    phase?: string;
    status?: string;
    company?: string;
    contact?: string;
    companyId?: string;
    contactId?: string;
  };
}) {
  const mode = searchParams?.mode === 'view' ? 'view' : 'data';
  const urlPhase = searchParams?.phase;
  const urlStatus = searchParams?.status;
  const urlCompany = searchParams?.company;
  const urlContact = searchParams?.contact;
  const urlCompanyId = searchParams?.companyId;
  const urlContactId = searchParams?.contactId;

  return (
    <OpportunitiesClientPage
      mode={mode}
      urlPhase={urlPhase}
      urlStatus={urlStatus}
      urlCompany={urlCompany}
      urlContact={urlContact}
      urlCompanyId={urlCompanyId}
      urlContactId={urlContactId}
    />
  );
}
