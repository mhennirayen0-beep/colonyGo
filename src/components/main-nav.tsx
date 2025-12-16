"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
} from "@/components/ui/sidebar";
import { LayoutDashboard, Briefcase, Settings, Users, Folder } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/opportunities",
    label: "Sales",
    icon: Briefcase,
  },
  {
    href: "/customers",
    label: "CRM",
    icon: Users,
  },
  {
    href: "/clients",
    label: "Clients",
    icon: Users,
  },
  {
    href: "/products",
    label: "Products",
    icon: Folder,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings
  }
];

export function MainNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { state } = useSidebar();

  return (
    <nav className={cn("p-2", className)}>
      <SidebarMenu>
        {menuItems.map((item) => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith(item.href)}
              tooltip={item.label}
            >
              <Link href={item.href}>
                <item.icon className="h-4 w-4 shrink-0" />
                <span className={cn(state === 'collapsed' && "hidden")}>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </nav>
  );
}
