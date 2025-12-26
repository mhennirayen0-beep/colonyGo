import { Suspense } from 'react';

import { AppRoutesClientLayout } from './routes-client-layout';

export default function AppRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <AppRoutesClientLayout>{children}</AppRoutesClientLayout>
    </Suspense>
  );
}
