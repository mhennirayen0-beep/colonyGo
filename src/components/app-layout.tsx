'use client';

import { Sidebar, SidebarHeader } from '@/components/ui/sidebar';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { Button } from './ui/button';
import { Bot, PanelLeftClose, PanelLeftOpen, Search, Menu } from 'lucide-react';
import { Input } from './ui/input';
import { AIAlertsPopover } from './ai/ai-alerts-popover';
import { AIAssistModal } from './ai/ai-assist-modal';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

function Header() {
  const { state, toggleSidebar } = useSidebar();
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
          className={cn(
            'w-full rounded-lg bg-secondary pl-8 transition-all duration-300 md:w-[200px] lg:w-[320px]'
          )}
        />
      </div>
      <div className="flex-1">
        <h1 className="hidden font-headline text-lg font-semibold text-primary md:block">
          ColonyGo Sales Navigator
        </h1>
      </div>
      <div className="flex items-center gap-2">
        <AIAssistModal />
        <AIAlertsPopover />
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
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-sidebar-primary" />
            <h2
              className={cn(
                'font-headline text-xl font-semibold text-sidebar-foreground',
                state === 'collapsed' && 'hidden'
              )}
            >
              ColonyGo
            </h2>
          </div>
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
