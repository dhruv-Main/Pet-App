/** Shared domain types consumed across features and the API layer. */

export type UserRole =
  | 'pet_parent'
  | 'veterinarian'
  | 'groomer'
  | 'trainer'
  | 'boarding_provider'
  | 'admin'
  | 'ngo'
  | 'influencer';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  roles: UserRole[];
  isPrime: boolean;
  loyaltyPoints: number;
  createdAt: string;
}

export type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'fish' | 'reptile' | 'other';
export type Gender = 'male' | 'female' | 'unknown';

export interface Vaccination {
  id: string;
  name: string;
  administeredAt?: string;
  dueAt: string;
  status: 'completed' | 'upcoming' | 'overdue';
}

export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string;
  photoUrl?: string;
  dateOfBirth?: string;
  ageMonths: number;
  gender: Gender;
  weightKg?: number;
  allergies: string[];
  medicalConditions: string[];
  insuranceProvider?: string;
  healthScore: number; // 0-100
  vaccinations: Vaccination[];
}

export type ProductCategory =
  | 'food'
  | 'treats'
  | 'supplements'
  | 'apparel'
  | 'accessories'
  | 'devices'
  | 'toys'
  | 'healthcare'
  | 'grooming';

export interface Product {
  id: string;
  title: string;
  brand: string;
  category: ProductCategory;
  price: number;
  mrp: number;
  rating: number;
  reviewCount: number;
  imageUrl?: string;
  isSubscribable: boolean;
  tags: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  subscription?: { intervalDays: number };
}

export type ServiceType =
  | 'vet_teleconsult'
  | 'vet_clinic'
  | 'grooming'
  | 'training'
  | 'walking'
  | 'boarding'
  | 'pet_sitting'
  | 'taxi'
  | 'relocation'
  | 'ambulance';

export interface ServiceProvider {
  id: string;
  name: string;
  type: ServiceType;
  rating: number;
  reviewCount: number;
  pricePerSession: number;
  avatarUrl?: string;
  verified: boolean;
  nextAvailable: string;
  about?: string;
  location?: string;
  experienceYears?: number;
  specialties?: string[];
}

export interface CommunityPost {
  id: string;
  author: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  content: string;
  imageUrl?: string;
  likes: number;
  comments: number;
  likedByMe: boolean;
  createdAt: string;
}

export interface ReminderItem {
  id: string;
  petId: string;
  type: 'vaccine' | 'medicine' | 'vet_visit' | 'feeding' | 'grooming';
  title: string;
  dueAt: string;
  completed: boolean;
}

export type OrderStatus = 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';

export interface OrderItem {
  productId: string;
  title: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  number: string;
  placedAt: string;
  status: OrderStatus;
  total: number;
  deliveryFee: number;
  paymentMethod: string;
  petId?: string;
  items: OrderItem[];
  deliveredAt?: string;
  estimatedDelivery?: string;
}

export type BookingStatus = 'confirmed' | 'in_progress' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  providerId: string;
  petId: string;
  title: string;
  kind: 'vet' | 'grooming' | 'walking' | 'training' | 'boarding' | 'taxi';
  startsAt: string;
  status: BookingStatus;
  price: number;
  location: string;
  notes?: string;
  rating?: number;
}

export type HealthRecordType = 'checkup' | 'vaccination' | 'treatment' | 'lab' | 'dental' | 'surgery' | 'grooming';

export interface HealthRecord {
  id: string;
  petId: string;
  date: string;
  type: HealthRecordType;
  title: string;
  provider: string;
  notes: string;
  cost?: number;
}

export interface PostComment {
  id: string;
  postId: string;
  author: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  content: string;
  likes: number;
  createdAt: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  venue: string;
  startsAt: string;
  attendees: number;
  category: 'meetup' | 'adoption' | 'health_camp' | 'workshop';
  going: boolean;
}

export interface LoyaltyAccount {
  points: number;
  tier: string;
  nextTier: string;
  pointsToNextTier: number;
  lifetimePoints: number;
  history: { id: string; date: string; delta: number; reason: string }[];
}

export interface PrimeMembership {
  plan: string;
  status: 'active' | 'expiring' | 'expired';
  memberSince: string;
  renewsOn: string;
  price: number;
  savingsToDate: number;
  freeDeliveries: number;
  teleconsultsRemaining: number;
  benefits: string[];
}