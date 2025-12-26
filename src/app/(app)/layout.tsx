'use client';

import { AppLayout } from '@/components/app-layout';
import { OpportunitiesProvider } from '@/lib/opportunities-store';

export default function AppRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OpportunitiesProvider>
      <AppLayout>{children}</AppLayout>
    </OpportunitiesProvider>
  );
}
