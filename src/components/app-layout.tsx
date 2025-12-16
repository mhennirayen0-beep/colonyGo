'use client';

import { Sidebar, SidebarHeader } from '@/components/ui/sidebar';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { Button } from './ui/button';
import { Bot, PanelLeftClose, PanelLeftOpen, Search } from 'lucide-react';
import { Input } from './ui/input';
import { AIAlertsPopover } from './ai/ai-alerts-popover';
import { AIAssistModal } from './ai/ai-assist-modal';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

function Header() {
  const { toggleSidebar, state } = useSidebar();
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
       <Button variant="ghost" size="icon" className="sm:hidden" onClick={toggleSidebar}>
        {state === 'expanded' ? <PanelLeftClose /> : <PanelLeftOpen />}
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
      <div className="relative flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="w-full rounded-lg bg-secondary pl-8 md:w-[200px] lg:w-[320px]"
        />
      </div>
      <div className="flex-1">
        <h1 className="font-headline text-lg font-semibold text-primary/80 hidden md:block">ColonyGo Sales Navigator</h1>
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
            <Bot className="h-6 w-6 text-primary" />
            <h2
              className={cn(
                'font-headline text-xl font-semibold text-primary-foreground',
                state === 'collapsed' && 'hidden'
              )}
            >
              ColonyGo
            </h2>
          </div>
        </SidebarHeader>
        <MainNav />
      </Sidebar>
      <div className={cn("flex flex-col flex-1", state === 'expanded' ? 'sm:ml-64' : 'sm:ml-14', "transition-all duration-300 ease-in-out")}>
        <Header />
        {children}
      </div>
    </div>
  );
}
