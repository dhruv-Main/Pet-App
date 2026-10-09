import type {
  Booking,
  CommunityEvent,
  HealthRecord,
  LoyaltyAccount,
  Order,
  Pet,
  PostComment,
  PrimeMembership,
  Product,
  ReminderItem,
  ServiceProvider,
  User,
  CommunityPost,
} from '@apptypes/domain';
import type {
  AgentAction,
  AgentTask,
  AppNotification,
  AuditEntry,
  ConsentProfile,
  PassportCredential,
  PetIdentity,
  TelemetryRecord,
  TwinHistory,
  TwinSnapshot,
  VerificationRequest,
} from '@apptypes/platform';

export interface DemoPet extends Pet {
  ownerId: string;
  color: string;
  microchipId: string;
  adoptedOn: string;
  vet: string;
  bio: string;
}

export interface DemoSubscription {
  id: string;
  title: string;
  petId: string;
  nextShipmentAt: string;
  amount: number;
  status: 'active' | 'paused';
  intervalDays: number;
  startedAt: string;
}

export interface DemoGps {
  petId: string;
  deviceId: string;
  model: string;
  battery: number;
  status: 'at_home' | 'walking';
  lastFix: { lat: number; lng: number; at: string; accuracyM: number };
  geofences: { id: string; name: string; lat: number; lng: number; radiusM: number }[];
  todayRoute: { lat: number; lng: number; at: string }[];
  weeklyDistanceKm: number[];
}

export interface DemoData {
  meta: { name: string; version: number; now: string; currency: string; locale: string; city: string };
  currentUserId: string;
  users: User[];
  pets: DemoPet[];
  healthRecords: HealthRecord[];
  passports: {
    identities: Record<string, PetIdentity>;
    credentials: PassportCredential[];
    verificationRequests: VerificationRequest[];
    verificationProgress: Record<
      string,
      { currentTier: string; percent: number; steps: { tier: string; label: string; state: 'done' | 'in_progress' | 'todo' }[] }
    >;
  };
  twins: { snapshots: Record<string, TwinSnapshot>; history: Record<string, TwinHistory> };
  agent: { tasks: AgentTask[]; actions: AgentAction[]; audit: AuditEntry[] };
  products: Product[];
  orders: Order[];
  subscriptions: DemoSubscription[];
  providers: ServiceProvider[];
  bookings: Booking[];
  notifications: AppNotification[];
  loyalty: LoyaltyAccount;
  prime: PrimeMembership;
  community: {
    posts: CommunityPost[];
    comments: PostComment[];
    likes: Record<string, string[]>;
    events: CommunityEvent[];
  };
  gps: Record<string, DemoGps>;
  telemetry: TelemetryRecord[];
  reminders: ReminderItem[];
  consent: ConsentProfile;
  spending: {
    monthly: { label: string; amount: number }[];
    byCategory: { key: string; label: string; amount: number }[];
    byPet: { petId: string; amount: number }[];
  };
}
