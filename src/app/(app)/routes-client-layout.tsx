'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AppLayout } from '@/components/app-layout';
import { OpportunitiesProvider } from '@/lib/opportunities-store';
import { useAuth } from '@/lib/auth-context';

export function AppRoutesClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      // keep it simple: all (app) routes are protected
      router.replace('/');
    }
  }, [isLoading, user, router, pathname]);

  if (isLoading) return null;
  if (!user) return null;

  return (
    <OpportunitiesProvider>
      <AppLayout>{children}</AppLayout>
    </OpportunitiesProvider>
  );
}
