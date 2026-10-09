/**
 * Pet OS first-class domain entities.
 * These map 1:1 to the bounded contexts defined in PET_OS_ARCHITECTURE.md and are
 * intentionally transport-agnostic so .NET / Python services can share the contracts.
 */

// ---------- Identity ----------
export type AssuranceTier = 'self_declared' | 'biometric' | 'microchip' | 'dna' | 'registry';

export const ASSURANCE_TIERS: readonly AssuranceTier[] = [
  'self_declared',
  'biometric',
  'microchip',
  'dna',
  'registry',
] as const;

export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'rejected' | 'expired';

export interface PetIdentity {
  petId: string;
  passportId: string;
  tier: AssuranceTier;
  status: VerificationStatus;
  microchipId?: string;
  biometricEnrolled: boolean;
  dnaLinked: boolean;
  issuedAt: string;
  verifiedAt?: string;
  verifiedBy?: string;
}

export type CredentialType =
  | 'vaccination'
  | 'microchip'
  | 'pedigree'
  | 'insurance'
  | 'health_certificate';

export interface PassportCredential {
  id: string;
  petId: string;
  type: CredentialType;
  title: string;
  issuer: string;
  issuedAt: string;
  expiresAt?: string;
  status: VerificationStatus;
  /** Short fingerprint of the issuer signature (W3C VC proof). */
  signatureFingerprint: string;
}

// ---------- Consent ----------
export type ConsentPurpose = 'health_data' | 'research' | 'insurance' | 'brand' | 'device';

export interface ConsentGrant {
  purpose: ConsentPurpose;
  granted: boolean;
  updatedAt: string;
}

export interface ConsentProfile {
  userId: string;
  version: number;
  grants: Record<ConsentPurpose, ConsentGrant>;
}

// ---------- Digital twin ----------
export type RiskLevel = 'low' | 'moderate' | 'elevated' | 'high';
export type RiskFactorKey = 'dental' | 'renal' | 'joint' | 'obesity' | 'dermatologic' | 'cardiac';

export interface RiskFactor {
  key: RiskFactorKey;
  label: string;
  score: number; // 0-100, higher = more risk
  level: RiskLevel;
  confidence: number; // 0-1
  drivers: string[];
}

export interface TwinRiskModel {
  modelVersion: string;
  overall: number; // 0-100 wellness (higher = better)
  level: RiskLevel;
  confidence: number;
  factors: RiskFactor[];
}

export type TelemetryMetric =
  | 'steps'
  | 'heart_rate'
  | 'sleep_minutes'
  | 'intake_grams'
  | 'weight_kg'
  | 'scratch_events';

export interface TelemetryRecord {
  id: string;
  petId: string;
  deviceId: string;
  metric: TelemetryMetric;
  value: number;
  unit: string;
  recordedAt: string;
}

export type InsightKind = 'health' | 'nutrition' | 'commerce' | 'lifestage' | 'behavior';

export interface PredictiveInsight {
  id: string;
  petId: string;
  kind: InsightKind;
  title: string;
  summary: string;
  confidence: number;
  horizonDays: number;
  createdAt: string;
  recommendedActionId?: string;
}

export interface LifeStageInsight {
  stage: 'puppy' | 'adolescent' | 'adult' | 'senior';
  progress: number; // 0-1 through current stage
  nextMilestone: string;
  guidance: string[];
}

export interface NutritionSummary {
  targetKcal: number;
  actualKcal: number;
  proteinPct: number;
  fatPct: number;
  carbPct: number;
  weeklyIntakeKcal: number[]; // 7 values
}

export interface TwinSnapshot {
  petId: string;
  capturedAt: string;
  risk: TwinRiskModel;
  weeklySteps: number[]; // 7 values
  weeklySleepMinutes: number[]; // 7 values
  nutrition: NutritionSummary;
  lifeStage: LifeStageInsight;
  insights: PredictiveInsight[];
  telemetry: TelemetryRecord[];
}

// ---------- Agents ----------
export type AgentRole =
  | 'triage'
  | 'nutrition'
  | 'commerce'
  | 'scheduling'
  | 'claims'
  | 'emergency';

export type AgentDomain = 'healthcare' | 'commerce' | 'booking' | 'insurance' | 'devices';

/** Action risk class governing autonomy (see agent safety envelope). */
export type AgentActionClass = 'read' | 'reversible_write' | 'financial_or_medical' | 'irreversible';

export type AgentActionKind =
  | 'book_appointment'
  | 'place_order'
  | 'submit_claim'
  | 'adjust_feeding'
  | 'schedule_reminder';

export type AgentActionStatus =
  | 'proposed'
  | 'executing'
  | 'completed'
  | 'rejected'
  | 'undone'
  | 'failed';

export interface CostEstimate {
  amount: number;
  currency: 'INR';
  note?: string;
}

export interface AgentAction {
  id: string;
  taskId: string;
  petId: string;
  agent: AgentRole;
  domain: AgentDomain;
  kind: AgentActionKind;
  actionClass: AgentActionClass;
  title: string;
  rationale: string;
  citations: string[];
  source: string;
  confidence: number;
  status: AgentActionStatus;
  cost?: CostEstimate;
  /** Seconds the user can undo after execution. 0 = not undoable. */
  undoWindowSec: number;
  createdAt: string;
  executedAt?: string;
  undoDeadline?: string;
}

export type AgentTaskStatus = 'awaiting_approval' | 'running' | 'done' | 'cancelled';

export interface AgentTask {
  id: string;
  petId: string;
  agent: AgentRole;
  goal: string;
  status: AgentTaskStatus;
  actionIds: string[];
  createdAt: string;
}

export interface AuditEntry {
  id: string;
  actionId: string;
  at: string;
  actor: 'agent' | 'user' | 'system';
  event: 'proposed' | 'approved' | 'rejected' | 'executed' | 'failed' | 'undone';
  detail?: string;
}

// ---------- Agent provenance (added) ----------
// AgentAction.source / confidence are declared on the interface above.

// ---------- Notifications ----------
export type NotificationCategory =
  | 'health'
  | 'passport'
  | 'agent'
  | 'booking'
  | 'commerce'
  | 'subscription'
  | 'consent';

export type NotificationSeverity = 'info' | 'attention' | 'critical';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  /** In-app route to open when tapped. */
  target?: { screen: string; params?: Record<string, unknown> };
}

// ---------- Verification ----------
export type VerificationMethod = 'vet' | 'microchip' | 'dna' | 'biometric';
export type VerificationRequestStatus = 'submitted' | 'in_review' | 'approved' | 'rejected';

export interface VerificationRequest {
  id: string;
  petId: string;
  method: VerificationMethod;
  status: VerificationRequestStatus;
  submittedAt: string;
  updatedAt: string;
  note?: string;
  reviewer?: string;
}

// ---------- Twin history ----------
export interface TwinHistoryPoint {
  date: string; // ISO date
  wellness: number;
  steps: number;
  sleepMinutes: number;
  weightKg: number;
  confidence: number;
  factorScores: Record<RiskFactorKey, number>;
}

export interface TwinRecommendation {
  id: string;
  factor: RiskFactorKey;
  title: string;
  detail: string;
  impact: 'low' | 'medium' | 'high';
  confidence: number;
  source: string;
}

export interface TwinHistory {
  petId: string;
  points: TwinHistoryPoint[];
  recommendations: TwinRecommendation[];
}
