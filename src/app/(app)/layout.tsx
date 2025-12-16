'use client';

import { AppLayout } from '@/components/app-layout';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

export default function AppRoutesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { state } = useSidebar();
  return (
    <AppLayout>
      <main
        className={cn(
          'flex-1 overflow-y-auto p-4 sm:p-6 transition-[margin-left] duration-300 ease-in-out',
          state === 'expanded' ? 'sm:ml-64' : 'sm:ml-14'
        )}
      >
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </AppLayout>
  );
}
