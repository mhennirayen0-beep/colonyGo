// Central catalog of screens/modules used for:
// - Role Management permission subjects list
// - Sidebar navigation
// - Route-level view gating (frontend-only)

export type ScreenDef = {
  /** Permission subject key used in code: ability.can('view', subject) */
  subject: string;
  /** Human label shown in Role Management */
  label: string;
  /** Base route prefix for this screen */
  href: string;
  /** Optional group for navigation */
  group?: 'core' | 'sales' | 'colony' | 'admin' | 'user';
  /** Optional parent group label */
  parent?: string;
};

// NOTE: Subjects are strings on purpose.
// Backend sync (Part 2) will store/serve the same keys.

export const APP_SCREENS: ScreenDef[] = [
  // Core
  { subject: 'Dashboard', label: 'Dashboard', href: '/dashboard', group: 'core' },
  { subject: 'Client', label: 'Clients', href: '/clients', group: 'core' },
  { subject: 'Customer', label: 'Customers', href: '/customers', group: 'core' },
  { subject: 'Product', label: 'Products', href: '/products', group: 'core' },
  { subject: 'File', label: 'Colony Files', href: '/files', group: 'core' },
  { subject: 'Note', label: 'Colony Notes', href: '/notes', group: 'core' },

  // Sales
  { subject: 'Opportunity', label: 'Opportunities', href: '/opportunities', group: 'sales', parent: 'Colony Sales' },
  { subject: 'Quote', label: 'Quotes', href: '/quotes', group: 'sales', parent: 'Colony Sales' },
  { subject: 'Invoice', label: 'Invoices', href: '/invoices', group: 'sales', parent: 'Colony Sales' },
  { subject: 'Payment', label: 'Payments', href: '/payments', group: 'sales', parent: 'Colony Sales' },
  { subject: 'CRM', label: 'CRM', href: '/crm', group: 'sales', parent: 'Colony Sales' },

  // Colony modules (placeholders for future ERP features)
  { subject: 'ColonyBuy', label: 'Colony Buy', href: '/colony-buy', group: 'colony' },
  { subject: 'ColonyDesk', label: 'Colony Desk', href: '/colony-desk', group: 'colony' },
  { subject: 'ColonyPlan', label: 'Colony Plan', href: '/colony-plan', group: 'colony' },
  { subject: 'ColonySupply', label: 'Colony Supply', href: '/colony-supply', group: 'colony' },
  { subject: 'ColonyFinance', label: 'Colony Finance', href: '/colony-finance', group: 'colony' },
  { subject: 'ColonyResource', label: 'Colony Resource', href: '/colony-resource', group: 'colony' },
  { subject: 'ColonyTech', label: 'Colony Tech', href: '/colony-tech', group: 'colony' },

  // Admin colony
  { subject: 'ColonyAdmin', label: 'Colony Admin', href: '/colony-admin', group: 'admin' },
  { subject: 'ColonySecurity', label: 'Colony Security', href: '/colony-security', group: 'admin' },
  { subject: 'ColonyQuality', label: 'Colony Quality', href: '/colony-quality', group: 'admin' },

  // User/account
  { subject: 'Profile', label: 'Profile', href: '/profile', group: 'user' },
  { subject: 'Settings', label: 'Settings', href: '/settings', group: 'user' },
  { subject: 'Navigator', label: 'Navigator', href: '/navigator', group: 'user' },

  // Security / user management
  { subject: 'User', label: 'Users', href: '/user-management/users', group: 'user', parent: 'User Management' },
  { subject: 'Role', label: 'Roles', href: '/user-management/roles', group: 'user', parent: 'User Management' },
  { subject: 'Company', label: 'Companies', href: '/crm/companies', group: 'sales', parent: 'CRM' },
  { subject: 'Contact', label: 'Contacts', href: '/crm/contacts', group: 'sales', parent: 'CRM' },
];

export function getScreenByPathname(pathname: string) {
  const path = String(pathname || '/');
  // Pick the most specific (longest) matching prefix
  const matches = APP_SCREENS.filter((s) => path === s.href || path.startsWith(s.href + '/') || path.startsWith(s.href));
  if (!matches.length) return null;
  return matches.sort((a, b) => b.href.length - a.href.length)[0];
}
