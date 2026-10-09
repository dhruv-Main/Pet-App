import { api } from './baseApi';
import type { Product, Pet, ServiceProvider, CommunityPost, ReminderItem } from '@apptypes/domain';

/**
 * Example feature endpoints injected into the shared base API.
 * Each domain (commerce, services, community, health) injects its own slice,
 * mapping cleanly onto future microservices behind an API gateway.
 */
export const catalogApi = api.injectEndpoints({
  endpoints: (build) => ({
    getRecommendedProducts: build.query<Product[], { petId?: string }>({
      query: ({ petId }) => ({ url: 'catalog/recommended', params: { petId } }),
      providesTags: ['Product'],
    }),
    searchProducts: build.query<Product[], { q: string; category?: string }>({
      query: ({ q, category }) => ({ url: 'catalog/search', params: { q, category } }),
      providesTags: ['Product'],
    }),
    getPets: build.query<Pet[], void>({
      query: () => 'pets',
      providesTags: ['Pet'],
    }),
    getReminders: build.query<ReminderItem[], void>({
      query: () => 'reminders',
      providesTags: ['Reminder'],
    }),
    getServiceProviders: build.query<ServiceProvider[], { type?: string }>({
      query: ({ type }) => ({ url: 'services/providers', params: { type } }),
      providesTags: ['Service'],
    }),
    getCommunityFeed: build.query<CommunityPost[], { cursor?: string }>({
      query: ({ cursor }) => ({ url: 'community/feed', params: { cursor } }),
      providesTags: ['Post'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetRecommendedProductsQuery,
  useSearchProductsQuery,
  useGetPetsQuery,
  useGetRemindersQuery,
  useGetServiceProvidersQuery,
  useGetCommunityFeedQuery,
} = catalogApi;
