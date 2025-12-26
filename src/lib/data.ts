import type {
  User,
  Opportunity,
  Customer,
  Product,
  Alert,
  NewsEvent,
  SalesActionRow,
  SalesAlertRow,
  SalesNewsRow,
  RagStatus,
} from './types';

import { excelOpportunities, excelActions, excelAlerts, excelNewsFeed } from './excel-dummydata';

const getInitials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => (s[0] ?? '').toUpperCase())
    .join('') || 'CG';

const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));

/**
 * ---- Users (built from sales owners found in Excel dummy data) ----
 * We keep this compatible with UI components that expect User objects.
 */
const ownerNames = uniq([
  ...excelOpportunities.map((o) => o.opportunityowner),
  ...excelActions.map((a) => a.salesowner),
  ...excelAlerts.map((a) => a.salesowner),
  ...excelNewsFeed.map((n) => n.salesowner),
]);

export const users: User[] = ownerNames.map((displayName, idx) => ({
  uid: `user-${idx + 1}`,
  displayName,
  email: `${displayName.toLowerCase().replace(/\s+/g, '.').replace(/[^a-z0-9.]/g, '')}@colonygo.com`,
  role: displayName.toLowerCase().includes('marc') ? 'admin' : 'sales',
  photoURL: `https://picsum.photos/seed/colonygo-user-${idx + 1}/40/40`,
  initials: getInitials(displayName),
}));

/**
 * ---- Customers (built from Excel dummy data) ----
 */
const customerPairs = uniq(excelOpportunities.map((o) => `${o.customerid}|||${o.customername}`));
export const customers: Customer[] = customerPairs.map((pair, idx) => {
  const [id, name] = pair.split('|||');
  return {
    id,
    name,
    company: name,
    sector: '—',
    avatarUrl: `https://picsum.photos/seed/colonygo-customer-${idx + 1}/40/40`,
    initials: getInitials(name),
  };
});

const userByName = (name: string) => users.find((u) => u.displayName === name);

/**
 * Synthetic dates for opportunities (Excel dummy data has no dates).
 * We spread opportunities over the last 90 days deterministically so Period filters work.
 */
const baseOpp = new Date();
baseOpp.setHours(12, 0, 0, 0);

/**
 * ---- Opportunities (Excel -> app Opportunity type) ----
 */
export const opportunities: Opportunity[] = excelOpportunities.map((r) => ({
  id: r.opportunityid,
  createdAtISO: (() => { const d = new Date(baseOpp); d.setDate(d.getDate() - (Number(String(r.opportunityid).replace(/\D/g, '')) || 0) % 90); return d.toISOString(); })(),
  opportunityname: r.opportunityname,
  opportunitydescription: r.opportunitydescription,
  customerid: r.customerid,
  customername: r.customername,
  opportunitystatut: r.opportunitystatut as Opportunity['opportunitystatut'],
  opportunityphase: r.opportunityphase as Opportunity['opportunityphase'],
  hardware_price: Number(r.hardware_price) || 0,
  software_price: Number(r.software_price) || 0,
  service_price: Number(r.service_price) || 0,
  opportunityowner: r.opportunityowner,
  swot_strength: Number(r.swot_strength) || 0,
  swot_weakness: Number(r.swot_weakness) || 0,
  swot_opportunities: Number(r.swot_opportunities) || 0,
  swot_threats: Number(r.swot_threats) || 0,
  value_forecast: Number(r.value_forecast) || 0,
  value_final: Number(r.value_final) || 0,
  value_discount: Number(r.value_discount) || 0,
  value_budget: Number(r.value_budget) || 0,
  value_customer: Number(r.value_customer) || 0,
  value_bonus: Number(r.value_bonus) || 0,
  opportunityscl: String(r.opportunityscl ?? ''),
  ownerDetails: userByName(r.opportunityowner),
}));

/**
 * ---- Sales Management: additional datasets from Excel dummy blocks ----
 */
export const salesActions: SalesActionRow[] = excelActions.map((a) => ({
  opportunityid: a.opportunityid,
  title: a.title,
  clientname: a.clientname,
  currentaction: a.currentaction,
  salesowner: a.salesowner,
}));

export const salesAlerts: SalesAlertRow[] = excelAlerts.map((a) => ({
  opportunityname: a.opportunityname,
  currentaction: a.currentaction,
  delay_days: Number(a.delay_days) || 0,
  salesowner: a.salesowner,
}));

/**
 * Excel News Feed has no timestamp; we generate a deterministic timestamp per row
 * so the UI can sort and apply "Yesterday" vs "Today" grouping.
 */
const base = new Date();
base.setHours(12, 0, 0, 0);

export const salesNewsFeed: SalesNewsRow[] = excelNewsFeed.map((n, idx) => {
  const d = new Date(base);
  // spread items over last 12 days deterministically
  d.setDate(d.getDate() - (idx % 12));
  return {
    opportunityid: n.opportunityid,
    actioncompleted: n.actioncompleted,
    clientname: n.clientname,
    salesowner: n.salesowner,
    timestampISO: d.toISOString(),
  };
});

/**
 * RAG helper
 * Rule:
 * - red if delay >= 30 days
 * - orange if delay >= 15 days
 * - green otherwise
 */
export const ragFromDelay = (delayDays: number): RagStatus => {
  if (delayDays >= 30) return 'red';
  if (delayDays >= 15) return 'orange';
  return 'green';
};

/**
 * Derived mapping: link opportunities to alerts (by name match)
 */
export const getRagForOpportunityName = (opportunityName: string): RagStatus => {
  const alert = salesAlerts.find((a) => a.opportunityname === opportunityName);
  if (!alert) return 'green';
  return ragFromDelay(alert.delay_days);
};

/**
 * ---- Existing exports used by dashboard components (kept compatible) ----
 * Alerts: reuse Sales Alerts in a simple format.
 */
export const alerts: Alert[] = salesAlerts.map((a, idx) => ({
  id: `alert-${idx + 1}`,
  title: 'Alerte délai',
  opportunityId: `unknown-${idx + 1}`,
  opportunityTitle: a.opportunityname,
  description: `${a.currentaction} · Delay: ${a.delay_days} days`,
  timestamp: `${a.delay_days} days`,
}));

/**
 * News feed: map to existing NewsEvent type (synthetic).
 */
export const newsFeed: NewsEvent[] = salesNewsFeed.map((n, idx) => ({
  id: `news-${idx + 1}`,
  user: userByName(n.salesowner) ?? users[0]!,
  action: n.actioncompleted,
  opportunityTitle: n.clientname,
  timestamp: new Date(n.timestampISO).toLocaleDateString(),
}));

/**
 * Sales pipeline summary by phase (count).
 * (Used by existing SalesPipelineChart.)
 */
export const salesPipelineData = (['Prospection', 'Discovery', 'Evaluation', 'Deal'] as const).map((phase) => ({
  name: phase,
  value: opportunities.filter((o) => o.opportunityphase === phase).length,
}));

/**
 * Products kept for other module pages.
 */
export const products: Product[] = [
  { id: 'PROD-HW-001', name: 'Hardware Pack', type: 'Hardware', price: 15000 },
  { id: 'PROD-SW-001', name: 'Software License', type: 'Software', price: 5000 },
  { id: 'PROD-SRV-001', name: 'Service', type: 'Service', price: 10000 },
];
