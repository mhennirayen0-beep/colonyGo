export type User = {
  id: string;
  name: string;
  avatarUrl: string;
  initials: string;
};

export type Client = {
  id: string;
  name: string;
  email: string;
  company: string;
  avatarUrl: string;
  initials: string;
};

export type Opportunity = {
  id: string;
  title: string;
  client: string;
  value: number;
  stage: 'Discovery' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';
  owner: User;
  lastUpdate: string;
  products: string[];
};

export type Alert = {
  id: string;
  title: string;
  description: string;
  opportunityId: string;
  opportunityTitle: string;
  timestamp: string;
};

export type NewsItem = {
  id: string;
  user: User;
  action: string;
  opportunityTitle: string;
  timestamp: string;
};

export type MeetingNote = {
  id: string;
  title: string;
  content: string;
  date: string;
};
