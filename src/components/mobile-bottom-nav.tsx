'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Briefcase, Folder, LayoutDashboard, Settings, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/opportunities', label: 'Sales', Icon: Briefcase },
  { href: '/customers', label: 'CRM', Icon: Users },
  { href: '/products', label: 'Products', Icon: Folder },
  { href: '/settings', label: 'Settings', Icon: Settings },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        'fixed left-0 right-0 z-30 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80',
        // sits above the GyneAI bar
        'bottom-[64px] sm:hidden'
      )}
      aria-label="Primary"
    >
      <div className="mx-auto grid h-14 max-w-7xl grid-cols-5 px-2">
        {items.map(({ href, label, Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 rounded-xl px-1 text-xs',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('h-5 w-5', active && 'text-primary')} />
              <span className="truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
