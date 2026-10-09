import { demoData } from '@/demo/demoData';
import type { CommunityPost, Pet, Product, ReminderItem, ServiceProvider, User } from '@apptypes/domain';

/**
 * Catalogue, pet and community adapters over the demo dataset (`src/demo/demo-data.json`).
 * Replace the gateway in `services/data/gateway.ts` with a network adapter when the backend is live.
 */
export const mockUser: User = demoData.users.find((u) => u.id === demoData.currentUserId) ?? demoData.users[0];
export const mockUsers: User[] = demoData.users;
export const mockPets: Pet[] = demoData.pets;
export const mockProducts: Product[] = demoData.products;
export const mockProviders: ServiceProvider[] = demoData.providers;
export const mockFeed: CommunityPost[] = demoData.community.posts;
export const mockReminders: ReminderItem[] = demoData.reminders;
