import type {
  Booking,
  CommunityEvent,
  CommunityPost,
  HealthRecord,
  LoyaltyAccount,
  Order,
  Pet,
  PostComment,
  PrimeMembership,
  Product,
  ServiceProvider,
  User,
} from '@apptypes/domain';
import { demoData } from '@/demo/demoData';
import type { DemoSubscription } from '@/demo/demoTypes';
import {
  mockFeed,
  mockPets,
  mockProducts,
  mockProviders,
  mockUser,
} from '@services/mock/fixtures';

/**
 * Read-side data port used by every screen. Screens depend on the hooks in `./hooks`,
 * never on fixtures. Swap `dataGateway` for an adapter that calls the .NET catalog,
 * pet and community services (or RTK Query endpoints) and no screen changes.
 */
export interface DataGateway {
  pets(): Pet[];
  petById(id: string): Pet | undefined;
  products(): Product[];
  productById(id: string): Product | undefined;
  providers(): ServiceProvider[];
  providerById(id: string): ServiceProvider | undefined;
  feed(): CommunityPost[];
  postById(id: string): CommunityPost | undefined;
  /** Profile shown before the session user resolves. */
  fallbackUser(): User;
  commentsByPost(postId: string): PostComment[];
  events(): CommunityEvent[];
  orders(): Order[];
  subscriptions(): DemoSubscription[];
  bookings(): Booking[];
  healthRecords(petId: string): HealthRecord[];
  loyalty(): LoyaltyAccount;
  prime(): PrimeMembership;
}

const mockGateway: DataGateway = {
  pets: () => mockPets,
  petById: (id) => mockPets.find((p) => p.id === id),
  products: () => mockProducts,
  productById: (id) => mockProducts.find((p) => p.id === id),
  providers: () => mockProviders,
  providerById: (id) => mockProviders.find((p) => p.id === id),
  feed: () => mockFeed,
  postById: (id) => mockFeed.find((p) => p.id === id),
  fallbackUser: () => mockUser,
  commentsByPost: (postId) => demoData.community.comments.filter((c) => c.postId === postId),
  events: () => demoData.community.events,
  orders: () => [...demoData.orders].sort((a, b) => b.placedAt.localeCompare(a.placedAt)),
  subscriptions: () => demoData.subscriptions,
  bookings: () => demoData.bookings,
  healthRecords: (petId) =>
    demoData.healthRecords.filter((r) => r.petId === petId).sort((a, b) => b.date.localeCompare(a.date)),
  loyalty: () => demoData.loyalty,
  prime: () => demoData.prime,
};

let active: DataGateway = mockGateway;

export const dataGateway: DataGateway = {
  pets: () => active.pets(),
  petById: (id) => active.petById(id),
  products: () => active.products(),
  productById: (id) => active.productById(id),
  providers: () => active.providers(),
  providerById: (id) => active.providerById(id),
  feed: () => active.feed(),
  postById: (id) => active.postById(id),
  fallbackUser: () => active.fallbackUser(),
  commentsByPost: (id) => active.commentsByPost(id),
  events: () => active.events(),
  orders: () => active.orders(),
  subscriptions: () => active.subscriptions(),
  bookings: () => active.bookings(),
  healthRecords: (id) => active.healthRecords(id),
  loyalty: () => active.loyalty(),
  prime: () => active.prime(),
};

/** Install a production adapter at app start. */
export function setDataGateway(next: DataGateway) {
  active = next;
}
