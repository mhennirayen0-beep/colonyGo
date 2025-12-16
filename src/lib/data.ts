import type { User, Opportunity, Alert, NewsItem } from './types';

export const users: User[] = [
  { id: 'user-1', name: 'Alia Reddy', avatarUrl: 'https://picsum.photos/seed/user1/40/40', initials: 'AR' },
  { id: 'user-2', name: 'Ben Carson', avatarUrl: 'https://picsum.photos/seed/user2/40/40', initials: 'BC' },
  { id: 'user-3', name: 'Chloe Davis', avatarUrl: 'https://picsum.photos/seed/user3/40/40', initials: 'CD' },
  { id: 'user-4', name: 'David Garcia', avatarUrl: 'https://picsum.photos/seed/user4/40/40', initials: 'DG' },
];

export const opportunities: Opportunity[] = [
  {
    id: 'opp-1',
    title: 'Project Phoenix Deployment',
    client: 'Innovate Corp',
    value: 120000,
    stage: 'Proposal',
    owner: users[0],
    lastUpdate: '2 hours ago',
    products: ['Cloud Services', 'Analytics Suite'],
  },
  {
    id: 'opp-2',
    title: 'Quantum Leap Initiative',
    client: 'FutureTech Inc.',
    value: 250000,
    stage: 'Negotiation',
    owner: users[1],
    lastUpdate: '1 day ago',
    products: ['AI Core', 'Data Storage'],
  },
  {
    id: 'opp-3',
    title: 'Synergy Platform Integration',
    client: 'Synergy Solutions',
    value: 85000,
    stage: 'Won',
    owner: users[0],
    lastUpdate: '3 days ago',
    products: ['API Gateway', 'Support Package'],
  },
  {
    id: 'opp-4',
    title: 'NextGen OS Rollout',
    client: 'Pioneer Systems',
    value: 300000,
    stage: 'Discovery',
    owner: users[2],
    lastUpdate: '5 days ago',
    products: ['Operating System License'],
  },
  {
    id: 'opp-5',
    title: 'Digital Transformation Project',
    client: 'Legacy Holdings',
    value: 500000,
    stage: 'Proposal',
    owner: users[1],
    lastUpdate: '1 week ago',
    products: ['Consulting Services', 'Cloud Migration'],
  },
  {
    id: 'opp-6',
    title: 'Retail Analytics Upgrade',
    client: 'Global Mart',
    value: 75000,
    stage: 'Lost',
    owner: users[3],
    lastUpdate: '2 weeks ago',
    products: ['Analytics Suite'],
  },
];

export const alerts: Alert[] = [
  {
    id: 'alert-1',
    title: 'Stalled Opportunity',
    description: 'No activity in the last 10 days. Follow-up recommended.',
    opportunityId: 'opp-5',
    opportunityTitle: 'Digital Transformation Project',
    timestamp: '15m ago',
  },
  {
    id: 'alert-2',
    title: 'High Risk Detected',
    description: 'Client sentiment analysis indicates potential churn risk. Review communications.',
    opportunityId: 'opp-2',
    opportunityTitle: 'Quantum Leap Initiative',
    timestamp: '1h ago',
  },
  {
    id: 'alert-3',
    title: 'Proposal Deadline Approaching',
    description: 'Proposal for Pioneer Systems is due in 2 days.',
    opportunityId: 'opp-4',
    opportunityTitle: 'NextGen OS Rollout',
    timestamp: '4h ago',
  },
];

export const newsFeed: NewsItem[] = [
  {
    id: 'news-1',
    user: users[1],
    action: 'updated the stage to Negotiation',
    opportunityTitle: 'Quantum Leap Initiative',
    timestamp: '1 day ago',
  },
  {
    id: 'news-2',
    user: users[0],
    action: 'added a new quote',
    opportunityTitle: 'Project Phoenix Deployment',
    timestamp: '2 days ago',
  },
  {
    id: 'news-3',
    user: users[0],
    action: 'marked stage as Won',
    opportunityTitle: 'Synergy Platform Integration',
    timestamp: '3 days ago',
  },
  {
    id: 'news-4',
    user: users[2],
    action: 'added a new note',
    opportunityTitle: 'NextGen OS Rollout',
    timestamp: '5 days ago',
  },
];

export const salesPipelineData = [
  { name: 'Discovery', value: 4 },
  { name: 'Proposal', value: 3 },
  { name: 'Negotiation', value: 2 },
  { name: 'Won', value: 1 },
];

export const wonLostData = [
    { status: 'Won', count: 25, fill: 'var(--color-won)' },
    { status: 'Lost', count: 10, fill: 'var(--color-lost)' },
];

export const chartConfig = {
    won: {
      label: "Won",
      color: "hsl(var(--primary))",
    },
    lost: {
      label: "Lost",
      color: "hsl(var(--destructive))",
    },
  };
