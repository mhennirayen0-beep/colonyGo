import type { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  displayName: string;
  email: string;
  role: 'admin' | 'sales' | 'manager';
  photoURL?: string;
  createdAt?: Timestamp; // Making optional for mock data
  initials?: string; // For UI avatar fallback
}

export interface Customer {
  id: string; // Format: CS-AWS-001
  name: string; // Ex: "Amazon Web Services"
  company: string;
  email?: string;
  phone?: string;
  sector?: string;
  category?: string;
  createdAt?: Timestamp;
  avatarUrl?: string;
  initials?: string;
}

export interface Opportunity {
  id: string; // Format: OPP-00001
  createdAtISO?: string; // Synthetic (from dummydata) to enable period filtering
  currency?: string; // France default: "EUR"
  opportunityname: string;
  opportunitydescription: string;
  
  customerid: string; // Format: CS-AWS-001
  customername: string;

  /** Optional CRM linkage (Deals): company/contact */
  companyid?: string; // CO-000001
  companyname?: string;
  contactid?: string; // CT-000001
  contactname?: string;
  
  opportunitystatut: 'Forecast' | 'Start' | 'Stop' | 'Cancelled';
  opportunityphase: 'Prospection' | 'Discovery' | 'Evaluation' | 'Deal';
  
  hardware_price: number;
  software_price: number;
  service_price: number;
  
  opportunityowner: string;
  
  swot_strength: number;
  swot_weakness: number;
  swot_opportunities: number;
  swot_threats: number;
  
  value_forecast: number;
  value_final: number;
  value_discount: number;
  value_budget: number;
  value_customer: number;
  value_bonus: number;
  
  opportunityscl: string; // Ex: "Technical Acceptance Payment:31%; Design Approval Payment:69%"
  
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: string;

  // For UI convenience
  ownerDetails?: User;
}

export interface LineItem {
  description: string;
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  productid?: string;
}

export interface Quote {
  id: string; // QTE-000001
  title: string;
  customerid: string;
  customername: string;
  opportunityid?: string;
  opportunityname?: string;
  status: 'Draft' | 'Sent' | 'Accepted' | 'Rejected' | 'Expired';
  currency?: string; // default EUR
  vat_rate?: number; // 0 / 5.5 / 10 / 20
  line_items?: LineItem[];
  total_excl_tax: number;
  total_tax: number;
  total_incl_tax: number;
  valid_until?: string;
  sent_on?: string;
  accepted_on?: string;
  rejected_on?: string;
  expired_on?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Invoice {
  id: string; // INV-000001
  title: string;
  customerid: string;
  customername: string;
  opportunityid?: string;
  opportunityname?: string;
  quoteid?: string;
  quotetitle?: string;
  status: 'Draft' | 'Issued' | 'Paid' | 'Cancelled';
  currency?: string; // default EUR
  vat_rate?: number; // 0 / 5.5 / 10 / 20
  line_items?: LineItem[];
  total_excl_tax: number;
  total_tax: number;
  total_incl_tax: number;
  /** Sum of payments already recorded for this invoice. */
  paid_total?: number;
  /** Remaining due = total_incl_tax - paid_total (never < 0). */
  remaining_due?: number;
  issued_on?: string;
  due_on?: string;
  paid_on?: string;
  payment_reference?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Payment {
  id: string; // PAY-000001
  invoiceid: string; // INV-000001
  invoicetitle?: string;
  customerid: string;
  customername: string;
  currency?: string; // defaults to invoice currency
  amount: number;
  method: 'Cash' | 'Card' | 'Transfer' | 'Check' | 'Other';
  paid_on: string; // ISO
  reference?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
    id: string;
    name: string;
    type: 'Hardware' | 'Software' | 'Service';
    price: number;
}

export interface ColonyFile {
  fileid: string;
  filename: string;
  fileuploaddate: Timestamp;
  fileref: string; // Reference module (opportunityid, projectid, etc.)
  filetype: string; // Ex: "pdf", "docx"
  fileurl: string; // Firebase Storage URL
  uploadedBy: string;
  index_short?: string; // Preview/description courte
}

export interface ColonyNote {
  noteid: string;
  notestatement: string; // Contenu de la note
  notecycle: 'Opportunity' | 'Project';
  noteref: string; // opportunityid ou projectid
  notetype: 'Action' | 'Decision' | 'Information' | 'Risk';
  noteowner: string; // User concerné
  notecreator: string; // User créateur
  noteduedate?: Timestamp;
  createdAt: Timestamp;
}

export interface Alert {
  id: string;
  title: string;
  opportunityId: string;
  opportunityTitle: string;
  description: string;
  timestamp: string;
}

export interface NewsEvent {
  id: string;
  user: User;
  action: string;
  opportunityTitle: string;
  timestamp: string;
}

// ---- Excel Dummydata types (Sales Management) ----

export type OpportunityStatus = 'Forecast' | 'Start' | 'Stop' | 'Cancelled';
export type OpportunityPhase = 'Prospection' | 'Discovery' | 'Evaluation' | 'Deal';

export type ExcelOpportunityRow = {
  opportunityid: string;
  opportunityname: string;
  opportunitydescription: string;
  customerid: string;
  customername: string;
  opportunitystatut: OpportunityStatus;
  hardware_price: number;
  software_price: number;
  service_price: number;
  opportunityphase: OpportunityPhase;
  opportunityowner: string;
  swot_strength: number;
  swot_weakness: number;
  swot_opportunities: number;
  swot_threats: number;
  value_forecast: number;
  value_final: number;
  value_discount: number;
  value_budget: number;
  value_customer: number;
  value_bonus: number;
  opportunityscl: string;
};

export type SalesActionRow = {
  opportunityid: string;
  title: string;
  clientname: string;
  currentaction: string;
  salesowner: string;
};

export type SalesAlertRow = {
  opportunityname: string;
  currentaction: string;
  delay_days: number;
  salesowner: string;
};

export type SalesNewsRow = {
  opportunityid: string;
  actioncompleted: string;
  clientname: string;
  salesowner: string;
  /** synthetic timestamp (ISO) used for UI ordering */
  timestampISO: string;
};

export type RagStatus = 'green' | 'orange' | 'red';

export interface Company {
  id: string; // CO-000001
  name: string;
  industry?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Contact {
  id: string; // CT-000001
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  notes?: string;
  companyId?: string;
  companyName?: string;
}
