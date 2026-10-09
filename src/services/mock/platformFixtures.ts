import type {
  AgentAction,
  AgentTask,
  AppNotification,
  AuditEntry,
  ConsentProfile,
  PassportCredential,
  PetIdentity,
  TwinHistory,
  TwinSnapshot,
  VerificationMethod,
  VerificationRequest,
} from '@apptypes/platform';
import { demoData, formatDay, formatWhen } from '@/demo/demoData';

/**
 * Identity, Twin, Agent and dashboard adapters over the demo dataset.
 * Replace with real services; export names and shapes are the contract.
 */

/** Mutable copy: verification flows update identities in memory. */
export const mockIdentities: Record<string, PetIdentity> = { ...demoData.passports.identities };
export const mockCredentials: PassportCredential[] = demoData.passports.credentials;
export const mockConsent: ConsentProfile = demoData.consent;
export const mockVerificationRequests: VerificationRequest[] = demoData.passports.verificationRequests;
export const verificationProgress = demoData.passports.verificationProgress;

const EMPTY_SNAPSHOT = (petId: string): TwinSnapshot => {
  const first = Object.values(demoData.twins.snapshots)[0];
  return { ...first, petId, insights: [], telemetry: [] };
};

export const buildTwinSnapshot = (petId: string): TwinSnapshot => demoData.twins.snapshots[petId] ?? EMPTY_SNAPSHOT(petId);

export function buildTwinHistory(petId: string): TwinHistory {
  return demoData.twins.history[petId] ?? { petId, points: [], recommendations: [] };
}

export const seedAgentTasks: AgentTask[] = demoData.agent.tasks;
export const seedAgentActions: AgentAction[] = demoData.agent.actions;
export const seedAudit: AuditEntry[] = demoData.agent.audit;
export const seedNotifications: AppNotification[] = demoData.notifications;

export interface ActiveService {
  id: string;
  title: string;
  provider: string;
  petName: string;
  when: string;
  status: 'confirmed' | 'in_progress';
  kind: 'vet' | 'grooming' | 'walking' | 'training' | 'boarding' | 'taxi';
}

export const mockActiveServices: ActiveService[] = demoData.bookings
  .filter((b) => b.status === 'confirmed' || b.status === 'in_progress')
  .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  .map((b) => ({
    id: b.id,
    title: b.title,
    provider: demoData.providers.find((p) => p.id === b.providerId)?.name ?? 'Provider',
    petName: demoData.pets.find((p) => p.id === b.petId)?.name ?? '',
    when: formatWhen(b.startsAt),
    status: b.status === 'in_progress' ? 'in_progress' : 'confirmed',
    kind: b.kind,
  }));

export interface SubscriptionSummary {
  id: string;
  title: string;
  nextShipment: string;
  amount: number;
  status: 'active' | 'paused';
}

export const mockSubscriptions: SubscriptionSummary[] = demoData.subscriptions.map((s) => ({
  id: s.id,
  title: s.title,
  nextShipment: s.status === 'paused' ? 'Paused' : formatDay(s.nextShipmentAt),
  amount: s.amount,
  status: s.status,
}));

export interface TierDetail {
  method: VerificationMethod;
  title: string;
  assurance: string;
  requirements: string[];
  turnaround: string;
}

export const verificationCatalog: TierDetail[] = [
  { method: 'vet', title: 'Veterinarian attestation', assurance: 'High', requirements: ['Registered veterinarian', 'In-person examination', 'Signed credential'], turnaround: '1 to 2 days' },
  { method: 'microchip', title: 'Microchip verification', assurance: 'High', requirements: ['ISO 11784/5 chip number', 'Chip read at a clinic'], turnaround: 'Same day' },
  { method: 'dna', title: 'DNA verification', assurance: 'Highest', requirements: ['Lab swab kit', 'Accredited laboratory report'], turnaround: '10 to 14 days' },
  { method: 'biometric', title: 'Biometric match', assurance: 'Medium', requirements: ['Three clear nose print images', 'Good lighting'], turnaround: 'Minutes' },
];

export interface SpendingCategory {
  key: string;
  label: string;
  amount: number;
}

export const mockMonthlySpend: { label: string; amount: number }[] = demoData.spending.monthly;
export const mockSpendByCategory: SpendingCategory[] = demoData.spending.byCategory;
