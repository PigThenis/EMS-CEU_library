export type UserRole = 'EMR' | 'EMT' | 'AEMT' | 'Paramedic';

export interface User {
  id: string;
  email: string;
  passwordHash: string; // placeholder only; replace with proper auth later
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface UserProfile {
  userId: string;
  homeZip?: string;
  lat?: number;
  lng?: number;
  preferences?: {
    modality?: ('in-person' | 'virtual' | 'hybrid')[];
    maxDistanceMiles?: number;
    categories?: string[];
  };
}

export interface License {
  userId: string;
  jurisdiction: 'TN';
  licenseNumber?: string; // optional per requirements
  level: UserRole;
  issueDate?: string;
  expirationDate?: string;
  renewalCycleMonths?: number; // placeholder default
  nremtNumber?: string;
  nremtStatus?: 'active' | 'inactive' | 'unknown';
}

export interface RequirementTemplate {
  id: string;
  jurisdiction: 'TN';
  role: UserRole;
  version: string;
  totalCeuRequired: number;
  cycleMonths: number;
  categories: Record<string, number>; // { trauma: 4, pediatric: 4, ... }
  effectiveStart?: string;
  effectiveEnd?: string;
}

export interface UserRequirement {
  userId: string;
  templateId: string;
  overrides?: Partial<RequirementTemplate>;
  cycleStart?: string;
  cycleEnd?: string;
  status?: 'draft' | 'active' | 'completed';
}

export interface UserCEURecord {
  userId: string;
  eventId?: string; // optional until events exist
  title: string;
  date: string;
  hoursTotal: number;
  hoursByCategory?: Record<string, number>;
  certificateUrl?: string;
  verifiedStatus?: 'unverified' | 'verified' | 'rejected';
}

// In-memory stores (placeholder) - replace with DB later
export const db = {
  users: new Map<string, User>(),
  profiles: new Map<string, UserProfile>(),
  licenses: new Map<string, License>(),
  requirementTemplates: new Map<string, RequirementTemplate>(),
};

