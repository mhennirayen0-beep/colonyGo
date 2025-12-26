'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sidebar, SidebarHeader } from '@/components/ui/sidebar';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { HelpCircle, Menu, MessageSquare, Search } from 'lucide-react';
import { GyneAIBar } from '@/components/ai/gyneai-bar';
import { MobileBottomNav } from '@/components/mobile-bottom-nav';
import { SalesModeToggle } from '@/components/sales-management/sales-mode-toggle';
import { SalesSectionToggle } from '@/components/sales-management/sales-section-toggle';
import { useSearchParams } from 'next/navigation';

function Header() {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const sp = useSearchParams();
  const tab = (sp.get('tab') ?? 'sales') === 'crm' ? 'crm' : 'sales';

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <Button variant="ghost" size="icon" className="sm:hidden" onClick={toggleSidebar}>
        <Menu />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>

      <div className="relative flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className={cn('w-full rounded-lg bg-secondary pl-8 md:w-[200px] lg:w-[320px]')}
        />
      </div>

      {/* Top center: Data/View toggle on Sales Management page */}
      <div className="hidden flex-1 justify-center md:flex">
        {pathname.startsWith('/opportunities') ? (
          <div className="flex items-center gap-3">
            <SalesSectionToggle />
            {tab === 'sales' && <SalesModeToggle />}
          </div>
        ) : (
          <h1 className="font-headline text-lg font-semibold text-primary">ColonyGo</h1>
        )}
      </div>

      {/* Top-right actions: Messages, Help, Profile/Disconnect */}
      <div className="flex items-center gap-1 sm:gap-2">
        <Button variant="ghost" size="icon" aria-label="Messages">
          <MessageSquare className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Help">
          <HelpCircle className="h-4 w-4" />
        </Button>
        <UserNav />
      </div>
    </header>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { state } = useSidebar();

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <Sidebar>
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-xl bg-white">
              <Image
                src="/brand/colonygo-logo.png"
                alt="ColonyGo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className={cn('leading-tight', state === 'collapsed' && 'hidden')}>
              <div className="font-headline text-base font-semibold text-sidebar-foreground">ColonyGo</div>
              <div className="text-xs text-sidebar-foreground/80">ERP</div>
            </div>
          </Link>
        </SidebarHeader>
        <MainNav />
      </Sidebar>

      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300 ease-in-out',
          state === 'expanded' ? 'sm:ml-64' : 'sm:ml-14'
        )}
      >
        <Header />
        {/* Add extra bottom padding so content doesn't hide behind fixed GyneAI bar */}
        <main className="flex-1 overflow-y-auto p-4 pb-36 sm:p-6 sm:pb-24">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>

      <MobileBottomNav />
      <GyneAIBar />
    </div>
  );
}
