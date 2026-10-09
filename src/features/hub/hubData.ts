import raw from '@/demo/hub-data.json';
import type { IconName } from '@components/ui';

export type FeatureMode = 'shop' | 'service' | 'listing' | 'tool' | 'link';

export interface HubFeature {
  n: number;
  key: string;
  group: string;
  title: string;
  tagline: string;
  icon: IconName;
  img: string;
  mode: FeatureMode;
  target: string;
}

export interface HubGroup {
  id: string;
  title: string;
  blurb: string;
  icon: IconName;
}

export interface HubCollection {
  title: string;
  blurb: string;
  tags?: string[];
  categories?: string[];
  subscribable?: boolean;
}

export interface ActionField {
  key: string;
  label: string;
  type: 'chips' | 'text' | 'multiline';
  options?: string[] | '@pets';
  optional?: boolean;
  placeholder?: string;
}

export interface HubAction {
  kind: string;
  label: string;
  title: string;
  status: string;
  fields: ActionField[];
  steps: [string, string][];
  successTitle: string;
  successBody: string;
  pay?: boolean;
}

export interface HubEntry {
  id: string;
  title: string;
  subtitle: string;
  img: string;
  tags: string[];
  meta: [string, string][];
  about: string;
  highlights: string[];
  verified?: boolean;
  badge?: string;
  price?: string;
  rating?: number;
  reviews?: number;
}

export interface HubListing {
  key: string;
  title: string;
  eyebrow: string;
  blurb: string;
  icon: IconName;
  hero: string;
  filters: string[];
  searchPlaceholder: string;
  secondary: string;
  action: HubAction;
  entries: HubEntry[];
}

export interface Breed {
  name: string;
  img: string;
  size: number;
  energy: number;
  apartment: number;
  kids: number;
  grooming: number;
  trainable: number;
  shedding: number;
  note: string;
}

interface HubTools {
  breeds: Breed[];
  symptoms: { key: string; label: string; weight: number }[];
  hospitals: { id: string; name: string; area: string; km: number; phone: string; eta: string; open: string }[];
  rewards: { id: string; title: string; cost: number; icon: IconName }[];
  camera: { events: { id: string; time: string; title: string; body: string; icon: IconName }[] };
  feeding: { id: string; label: string; time: string; grams: number; on: boolean }[];
  birthday: { key: string; title: string; body: string; icon: IconName }[];
  vault: { id: string; title: string; kind: string; date: string; size: string }[];
  garments: { key: string; label: string; price: number }[];
}

const data = raw as unknown as {
  groups: HubGroup[];
  features: HubFeature[];
  collections: Record<string, HubCollection>;
  listings: Record<string, HubListing>;
  tools: HubTools;
};

export const hubGroups = data.groups;
export const hubFeatures = data.features;
export const hubCollections = data.collections;
export const hubListings = data.listings;
export const hubTools = data.tools;

export const listingEntry = (listing: string, id: string) => hubListings[listing]?.entries.find((e) => e.id === id);

/** Stable short reference such as `PET-48213`. */
export function refCode(seed: string): string {
  let h = 7;
  for (let i = 0; i < seed.length; i++) h = (h * 33 + seed.charCodeAt(i)) % 90000;
  return `PET-${10000 + h}`;
}
