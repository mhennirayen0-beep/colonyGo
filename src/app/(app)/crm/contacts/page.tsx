import { CrmContactsClientPage } from "./ui";

export default function CrmContactsPage({
  searchParams,
}: {
  searchParams: { companyId?: string };
}) {
  return <CrmContactsClientPage companyId={searchParams.companyId} />;
}
