"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  BarChart3,
  Briefcase,
  ShoppingCart,
  ClipboardList,
  Calendar,
  Truck,
  Wallet,
  Users,
  Cpu,
  Settings,
  Shield,
  BadgeCheck,
  Folder,
  StickyNote,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAbility } from '@/lib/ability';

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3, subject: 'Dashboard' },
  {
    href: "/opportunities?tab=sales&mode=data",
    label: "Colony Sales",
    icon: Briefcase,
    subject: 'Opportunity',
    children: [
      { href: "/opportunities?tab=sales&mode=data", label: "Sales Management" },
      { href: "/opportunities?tab=crm&mode=data", label: "CRM" },
    ],
  },
  { href: "/colony-buy", label: "Colony Buy", icon: ShoppingCart },
  { href: "/colony-desk", label: "Colony Desk", icon: ClipboardList },
  { href: "/colony-plan", label: "Colony Plan", icon: Calendar },
  { href: "/colony-supply", label: "Colony Supply", icon: Truck },
  { href: "/colony-finance", label: "Colony Finance", icon: Wallet },
  { href: "/colony-resource", label: "Colony Resource", icon: Users },
  { href: "/colony-tech", label: "Colony Tech", icon: Cpu },
  { href: "/colony-admin", label: "Colony Admin", icon: Settings },
  { href: "/colony-security", label: "Colony Security", icon: Shield },
  { href: "/colony-quality", label: "Colony Quality", icon: BadgeCheck },
  { href: "/customers", label: "Customers", icon: Users, subject: 'Customer' },
  { href: "/products", label: "Products", icon: ShoppingCart, subject: 'Product' },
  { href: "/files", label: "Colony Files", icon: Folder, subject: 'File' },
  { href: "/notes", label: "Colony Notes", icon: StickyNote, subject: 'Note' },
];

export function MainNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const sp = useSearchParams();
  const { state } = useSidebar();
  const ability = useAbility();

  const canSeeUserManagement =
    (ability.roleName || '').toLowerCase() === 'superadmin' ||
    ability.can('view', 'User') ||
    ability.can('view', 'Role') ||
    ability.can('manage', 'User') ||
    ability.can('manage', 'Role');

  const salesTab = (sp.get('tab') ?? 'sales') === 'crm' ? 'crm' : 'sales';
  const onSales = pathname.startsWith('/opportunities');
  const onUserManagement = pathname.startsWith('/user-management');

  return (
    <nav className={cn("p-2", className)}>
      <SidebarMenu>
        {[...menuItems,
          ...(canSeeUserManagement
            ? [
                {
                  href: '/user-management/users',
                  label: 'User Management',
                  icon: UserCog,
                  children: [
                    { href: '/user-management/roles', label: 'Role Management' },
                    { href: '/user-management/users', label: 'User Management' },
                  ],
                },
              ]
            : []),
        ].filter((it: any) => {
          // hide core CRUD modules if user cannot view
          if (!it.subject) return true;
          return ability.can('view', it.subject);
        }).map((item: any) => {
          const isSalesGroup = item.label === 'Colony Sales';
          const isUserMgmtGroup = item.label === 'User Management';

          if (!item.children) {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className={cn(state === 'collapsed' && 'hidden')}>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          const groupActive = isSalesGroup ? onSales : isUserMgmtGroup ? onUserManagement : pathname === item.href;
          return (
            <SidebarMenuItem key={item.label}>
              <SidebarMenuButton asChild isActive={groupActive} tooltip={item.label}>
                <Link href={item.href}>
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span className={cn(state === 'collapsed' && 'hidden')}>{item.label}</span>
                </Link>
              </SidebarMenuButton>

              {/* Sub-items (Sales / CRM) */}
              <div className={cn('mt-1 flex flex-col gap-1 pl-2', state === 'collapsed' && 'hidden')}>
                {item.children.map((child: any) => {
                  const isChildActive = isSalesGroup
                    ? onSales && ((child.label === 'CRM' && salesTab === 'crm') || (child.label !== 'CRM' && salesTab === 'sales'))
                    : pathname === child.href || pathname.startsWith(child.href + '/');

                  return (
                    <SidebarMenuButton
                      key={child.href}
                      asChild
                      isActive={isChildActive}
                      className={cn(
                        'h-8 rounded-md px-3 text-xs opacity-90',
                        isChildActive && 'opacity-100'
                      )}
                    >
                      <Link href={child.href}>{child.label}</Link>
                    </SidebarMenuButton>
                  );
                })}
              </div>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </nav>
  );
}
