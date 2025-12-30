"use client";

import { usePathname } from "next/navigation";
import { Sidebar, SidebarHeader } from "@/components/ui/sidebar";
import { MainNav } from "@/components/main-nav";
import { UserNav } from "@/components/user-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { HelpCircle, Menu, MessageSquare, Search } from "lucide-react";
import { GyneAIBar } from "@/components/ai/gyneai-bar";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { SalesModeToggle } from "@/components/sales-management/sales-mode-toggle";
import { ModuleMenuTrigger } from "@/components/module-menu";
import { useAbility } from "@/lib/ability";
import { getScreenByPathname } from "@/config/screens";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

function Header() {
  const { toggleSidebar } = useSidebar();
  const pathname = usePathname();
  const onSales = pathname.startsWith("/opportunities") || pathname.startsWith("/crm");

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="sm:hidden"
        onClick={toggleSidebar}
      >
        <Menu />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>

      <div className="relative flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className={cn(
            "w-full rounded-lg bg-secondary pl-8 md:w-[200px] lg:w-[320px]"
          )}
        />
      </div>
      <div className="hidden flex-1 justify-center md:flex">
        {onSales ? (
          <div className="flex items-center gap-3">
            <SalesModeToggle />
          </div>
        ) : (
          <h1 className="font-headline text-lg font-semibold text-primary">
            ColonyGo
          </h1>
        )}
      </div>

      {/* Top-right actions: Messages, Help, Profile/Disconnect */}
      <div className="ml-auto flex items-center gap-1 sm:gap-2">
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
  const ability = useAbility();
  const pathname = usePathname();

  const screen = getScreenByPathname(pathname);
  const canView = !screen || ability.can('view', screen.subject);

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <Sidebar>
        <SidebarHeader>
          <ModuleMenuTrigger />
        </SidebarHeader>
        <MainNav />
      </Sidebar>

      <div
        className={cn(
          "flex flex-1 flex-col transition-all duration-300 ease-in-out",
          state === "expanded" ? "sm:ml-64" : "sm:ml-14"
        )}
      >
        <Header />
        {/* Add extra bottom padding so content doesn't hide behind fixed GyneAI bar */}
        <main className="flex-1 overflow-y-auto p-4 pb-36 sm:p-6 sm:pb-24">
          <div className="mx-auto w-full max-w-7xl">
            {canView ? (
              children
            ) : (
              <Card className="rounded-2xl shadow-sm">
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2">
                    <ShieldAlert className="h-5 w-5" /> Not allowed
                  </CardTitle>
                  <CardDescription>
                    You don&apos;t have permission to view <span className="font-medium">{screen?.label ?? 'this page'}</span>.
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </main>
      </div>

      <MobileBottomNav />
      <GyneAIBar />
    </div>
  );
}
