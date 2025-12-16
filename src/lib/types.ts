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
  opportunityname: string;
  opportunitydescription: string;
  
  customerid: string; // Format: CS-AWS-001
  customername: string;
  
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
