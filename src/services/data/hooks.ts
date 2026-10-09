import { useEffect, useMemo, useState } from 'react';
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
import { useAppSelector } from '@store/hooks';
import { simulateRequest, useNetworkState } from '@/demo/NetworkSimulator';
import { dataGateway } from './gateway';

/** Query-shaped result so call sites do not change when real network hooks replace the mock source. */
export interface DataResult<T> {
  data: T;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const noop = () => {};
const ok = <T,>(data: T): DataResult<T> => ({ data, isLoading: false, isError: false, refetch: noop });

export const usePets = (): DataResult<Pet[]> => {
  const member = useIsMember();
  return useMemo(() => ok(member ? dataGateway.pets() : []), [member]);
};

/** Resolves a pet by id. `data` is undefined when the id is unknown or omitted and the first pet is used only if no id was requested. */
export function usePet(id?: string): DataResult<Pet | undefined> {
  return useMemo(() => ok(id ? dataGateway.petById(id) : dataGateway.pets()[0]), [id]);
}

/** Keys already fetched under the current network mode; cleared when the mode changes. */
const loaded = new Set<string>();
let loadedEpoch = 0;

/**
 * Applies the simulated network to a list read: first load shows `isLoading`, offline and
 * error modes surface `isError` with a working `refetch`. Used by screens that render those states.
 */
export function useSimulated<T>(key: string, read: () => T, empty: T): DataResult<T> {
  const { epoch } = useNetworkState();
  if (epoch !== loadedEpoch) {
    loadedEpoch = epoch;
    loaded.clear();
  }
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>(loaded.has(key) ? 'ok' : 'loading');

  useEffect(() => {
    if (loaded.has(key)) {
      setStatus('ok');
      return;
    }
    let alive = true;
    setStatus('loading');
    simulateRequest(350)
      .then(() => {
        loaded.add(key);
        if (alive) setStatus('ok');
      })
      .catch(() => {
        if (alive) setStatus('error');
      });
    return () => {
      alive = false;
    };
  }, [key, epoch, attempt]);

  const data = useMemo(() => (status === 'ok' ? read() : empty), [status]); // eslint-disable-line react-hooks/exhaustive-deps
  return { data, isLoading: status === 'loading', isError: status === 'error', refetch: () => setAttempt((n) => n + 1) };
}

const NO_PRODUCTS: Product[] = [];
export const useProducts = (): DataResult<Product[]> =>
  useSimulated('products', () => dataGateway.products(), NO_PRODUCTS);

export const useProduct = (id?: string): DataResult<Product | undefined> =>
  useMemo(() => ok(id ? dataGateway.productById(id) : undefined), [id]);

export const useProviders = (): DataResult<ServiceProvider[]> =>
  useMemo(() => ok(dataGateway.providers()), []);

export const useProvider = (id?: string): DataResult<ServiceProvider | undefined> =>
  useMemo(() => ok(id ? dataGateway.providerById(id) : undefined), [id]);

export const useFeed = (): DataResult<CommunityPost[]> => useMemo(() => ok(dataGateway.feed()), []);

export const usePost = (id?: string): DataResult<CommunityPost | undefined> =>
  useMemo(() => ok(id ? dataGateway.postById(id) : undefined), [id]);

export const useComments = (postId?: string): DataResult<PostComment[]> =>
  useMemo(() => ok(postId ? dataGateway.commentsByPost(postId) : []), [postId]);

export const useEvents = (): DataResult<CommunityEvent[]> => useMemo(() => ok(dataGateway.events()), []);

export const useOrders = (): DataResult<Order[]> => {
  const member = useIsMember();
  return useMemo(() => ok(member ? dataGateway.orders() : []), [member]);
};

export const useBookings = (): DataResult<Booking[]> => {
  const member = useIsMember();
  return useMemo(() => ok(member ? dataGateway.bookings() : []), [member]);
};

export const useHealthRecords = (petId?: string): DataResult<HealthRecord[]> =>
  useMemo(() => ok(petId ? dataGateway.healthRecords(petId) : []), [petId]);

export const useLoyalty = (): DataResult<LoyaltyAccount> => useMemo(() => ok(dataGateway.loyalty()), []);

export const usePrime = (): DataResult<PrimeMembership> => useMemo(() => ok(dataGateway.prime()), []);

export function useIsMember(): boolean {
  return useAppSelector((s) => s.auth.status === 'authenticated');
}

export function useCurrentUser(): User {
  const user = useAppSelector((s) => s.auth.user);
  // Guests never receive demo account data.
  return user ?? ({ id: 'guest', name: 'Guest' } as User);
}
