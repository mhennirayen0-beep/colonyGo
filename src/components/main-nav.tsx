"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

// Permission subjects catalog (single source of truth)
import { APP_SCREENS } from '@/config/screens';

// Resolve subject key from catalog (fallback to provided)
function subjectFor(href: string, fallback?: string) {
  const path = href.split('?')[0];
  const found = APP_SCREENS.find((s) => s.href === path);
  return found?.subject ?? fallback;
}

const baseItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3, subject: subjectFor('/dashboard', 'Dashboard') },
  { href: "/clients", label: "Clients", icon: Users, subject: subjectFor('/clients', 'Client') },
  { href: "/customers", label: "Customers", icon: Users, subject: subjectFor('/customers', 'Customer') },
  { href: "/products", label: "Products", icon: ShoppingCart, subject: subjectFor('/products', 'Product') },
  { href: "/files", label: "Colony Files", icon: Folder, subject: subjectFor('/files', 'File') },
  { href: "/notes", label: "Colony Notes", icon: StickyNote, subject: subjectFor('/notes', 'Note') },
];

const salesItems = [
  {
    href: "/opportunities?mode=data",
    label: "Colony Sales",
    icon: Briefcase,
    // Sales group is visible if user can view at least one child screen
    children: [
      { href: "/opportunities?mode=data", label: "Opportunities", subject: subjectFor('/opportunities', 'Opportunity') },
      { href: "/quotes", label: "Quotes", subject: subjectFor('/quotes', 'Quote') },
      { href: "/invoices", label: "Invoices", subject: subjectFor('/invoices', 'Invoice') },
      { href: "/payments", label: "Payments", subject: subjectFor('/payments', 'Payment') },
      { href: "/crm?mode=data", label: "CRM", subject: subjectFor('/crm', 'CRM') },
    ],
  },
  { href: "/colony-buy", label: "Colony Buy", icon: ShoppingCart, subject: subjectFor('/colony-buy', 'ColonyBuy') },
  { href: "/colony-desk", label: "Colony Desk", icon: ClipboardList, subject: subjectFor('/colony-desk', 'ColonyDesk') },
  { href: "/colony-plan", label: "Colony Plan", icon: Calendar, subject: subjectFor('/colony-plan', 'ColonyPlan') },
  { href: "/colony-supply", label: "Colony Supply", icon: Truck, subject: subjectFor('/colony-supply', 'ColonySupply') },
  { href: "/colony-finance", label: "Colony Finance", icon: Wallet, subject: subjectFor('/colony-finance', 'ColonyFinance') },
  { href: "/colony-resource", label: "Colony Resource", icon: Users, subject: subjectFor('/colony-resource', 'ColonyResource') },
  { href: "/colony-tech", label: "Colony Tech", icon: Cpu, subject: subjectFor('/colony-tech', 'ColonyTech') },
];

const adminItems = [
  { href: "/colony-admin", label: "Colony Admin", icon: Settings, subject: subjectFor('/colony-admin', 'ColonyAdmin') },
  { href: "/colony-security", label: "Colony Security", icon: Shield, subject: subjectFor('/colony-security', 'ColonySecurity') },
  { href: "/colony-quality", label: "Colony Quality", icon: BadgeCheck, subject: subjectFor('/colony-quality', 'ColonyQuality') },
];

export function MainNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { state } = useSidebar();
  const ability = useAbility();

  const canSeeUserManagement =
    (ability.roleName || '').toLowerCase() === 'superadmin' ||
    ability.can('view', 'User') ||
    ability.can('view', 'Role') ||
    ability.can('manage', 'User') ||
    ability.can('manage', 'Role');

  const onSales = pathname.startsWith('/opportunities') || pathname.startsWith('/crm') || pathname.startsWith('/quotes') || pathname.startsWith('/invoices') || pathname.startsWith('/payments');
  const onUserManagement = pathname.startsWith('/user-management');

  // Hotfix: module switch removed. We show all modules directly in the nav.
  const menuItems = [...baseItems, ...salesItems, ...adminItems];

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
                    { href: '/user-management/roles', label: 'Role Management', subject: subjectFor('/user-management/roles', 'Role') },
                    { href: '/user-management/users', label: 'User Management', subject: subjectFor('/user-management/users', 'User') },
                  ],
                },
              ]
            : []),
        ].filter((it: any) => {
          // group items
          if (it.children?.length) {
            return it.children.some((c: any) => !c.subject || ability.can('view', c.subject));
          }
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

              {/* Sub-items */}
              <div className={cn('mt-1 flex flex-col gap-1 pl-2', state === 'collapsed' && 'hidden')}>
                {item.children
                  .filter((child: any) => !child.subject || ability.can('view', child.subject))
                  .map((child: any) => {
                  const isChildActive = isSalesGroup
                    ? (
                        (pathname.startsWith('/crm') && child.label === 'CRM') ||
                        (pathname.startsWith('/opportunities') && child.label === 'Opportunities') ||
                        (pathname.startsWith('/quotes') && child.label === 'Quotes') ||
                        (pathname.startsWith('/invoices') && child.label === 'Invoices') ||
                        (pathname.startsWith('/payments') && child.label === 'Payments')
                      )
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
