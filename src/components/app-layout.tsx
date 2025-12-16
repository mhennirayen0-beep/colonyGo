import { SidebarProvider, Sidebar, SidebarHeader, SidebarTrigger } from '@/components/ui/sidebar';
import { MainNav } from '@/components/main-nav';
import { UserNav } from '@/components/user-nav';
import { Button } from './ui/button';
import { Bell, Bot, Search } from 'lucide-react';
import { Input } from './ui/input';
import { AIAlertsPopover } from './ai/ai-alerts-popover';
import { AIAssistModal } from './ai/ai-assist-modal';

function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <SidebarTrigger className="sm:hidden" />
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
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full flex-col bg-muted/40">
        <Sidebar>
          <SidebarHeader>
             <div className="flex items-center gap-2">
                <Bot className="h-6 w-6 text-primary" />
                <h2 className="font-headline text-xl font-semibold text-primary group-data-[collapsible=icon]:hidden">ColonyGo</h2>
             </div>
          </SidebarHeader>
          <MainNav />
        </Sidebar>
        <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 group-data-[state=expanded]:sm:pl-64 transition-all duration-200 ease-in-out">
          <Header />
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <div className="mx-auto w-full max-w-[1200px]">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
