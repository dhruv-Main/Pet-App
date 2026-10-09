import { api } from './baseApi';
import type {
  AssuranceTier,
  PassportCredential,
  PetIdentity,
  TwinHistory,
  TwinSnapshot,
  VerificationMethod,
  VerificationRequest,
} from '@apptypes/platform';
import {
  buildTwinHistory,
  buildTwinSnapshot,
  mockCredentials,
  mockIdentities,
  mockVerificationRequests,
} from '@services/mock/platformFixtures';
import { mockPets } from '@services/mock/fixtures';
import { emitPetVerified, trackTwinSnapshot } from '@platform/events';

import { simulateRequest, toQueryError } from '@/demo/NetworkSimulator';

/** Applies simulated latency or failure; returns an RTK error object when the request should fail. */
const gate = async (ms: number) => {
  try {
    await simulateRequest(ms);
    return null;
  } catch (e) {
    return { error: toQueryError(e) };
  }
};

/** In-memory store standing in for the verification service until it ships. */
const verificationDb: VerificationRequest[] = [...mockVerificationRequests];

export interface PassportPayload {
  identity: PetIdentity;
  credentials: PassportCredential[];
}

export interface PassportLookup extends PassportPayload {
  petName: string;
  species: string;
  breed: string;
}

/**
 * Identity and Twin endpoints. The `queryFn` bodies are mock adapters; replace each
 * with `query: () => 'identity/...'` when the .NET identity and Python twin services ship.
 */
export const platformApi = api.injectEndpoints({
  endpoints: (build) => ({
    getPassport: build.query<PassportPayload, { petId: string }>({
      queryFn: async ({ petId }) => {
        const failed = await gate(450);
        if (failed) return failed;
        const identity = mockIdentities[petId];
        if (!identity) return { error: { status: 404, data: 'Passport not found' } };
        return {
          data: { identity, credentials: mockCredentials.filter((c) => c.petId === petId) },
        };
      },
      providesTags: (_r, _e, { petId }) => [{ type: 'Passport', id: petId }],
    }),

    requestVerification: build.mutation<PetIdentity, { petId: string; tier: AssuranceTier }>({
      queryFn: async ({ petId, tier }) => {
        const failed = await gate(700);
        if (failed) return failed;
        const current = mockIdentities[petId];
        if (!current) return { error: { status: 404, data: 'Passport not found' } };
        const next: PetIdentity = {
          ...current,
          tier,
          status: 'verified',
          biometricEnrolled: current.biometricEnrolled || tier === 'biometric',
          verifiedAt: new Date().toISOString(),
          verifiedBy: 'Pet OS automated verification',
        };
        mockIdentities[petId] = next;
        return { data: next };
      },
      invalidatesTags: (_r, _e, { petId }) => [{ type: 'Passport', id: petId }],
      async onQueryStarted({ petId, tier }, { queryFulfilled }) {
        try {
          await queryFulfilled;
          emitPetVerified({ petId, tier });
        } catch {
          // surfaced by the mutation state
        }
      },
    }),

    getTwinSnapshot: build.query<TwinSnapshot, { petId: string }>({
      queryFn: async ({ petId }) => {
        const failed = await gate(550);
        if (failed) return failed;
        return { data: buildTwinSnapshot(petId) };
      },
      providesTags: (_r, _e, { petId }) => [{ type: 'Twin', id: petId }],
      async onQueryStarted(_arg, { queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          trackTwinSnapshot(data);
        } catch {
          // ignore
        }
      },
    }),
    getTwinHistory: build.query<TwinHistory, { petId: string }>({
      queryFn: async ({ petId }) => {
        const failed = await gate(400);
        if (failed) return failed;
        return { data: buildTwinHistory(petId) };
      },
      providesTags: (_r, _e, { petId }) => [{ type: 'Twin', id: `${petId}-history` }],
    }),

    /** Resolves a scanned or shared passport code. Returns 404 for unknown codes. */
    lookupPassport: build.query<PassportLookup, { code: string }>({
      queryFn: async ({ code }) => {
        const failed = await gate(500);
        if (failed) return failed;
        const identity = Object.values(mockIdentities).find(
          (i) => i.passportId.toLowerCase() === code.toLowerCase(),
        );
        if (!identity) return { error: { status: 404, data: 'Passport not found' } };
        const pet = mockPets.find((p) => p.id === identity.petId);
        return {
          data: {
            identity,
            credentials: mockCredentials.filter((c) => c.petId === identity.petId),
            petName: pet?.name ?? 'Unknown',
            species: pet?.species ?? 'unknown',
            breed: pet?.breed ?? '',
          },
        };
      },
    }),

    getVerificationHistory: build.query<VerificationRequest[], { petId: string }>({
      queryFn: async ({ petId }) => {
        const failed = await gate(300);
        if (failed) return failed;
        const rows = verificationDb
          .filter((v) => v.petId === petId)
          .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
        return { data: rows };
      },
      providesTags: (_r, _e, { petId }) => [{ type: 'Verification', id: petId }],
    }),

    submitVerificationRequest: build.mutation<
      VerificationRequest,
      { petId: string; method: VerificationMethod; note?: string }
    >({
      queryFn: async ({ petId, method, note }) => {
        const failed = await gate(700);
        if (failed) return failed;
        const open = verificationDb.find(
          (v) => v.petId === petId && v.method === method && (v.status === 'submitted' || v.status === 'in_review'),
        );
        if (open) return { error: { status: 409, data: 'A request for this method is already open' } };
        const now = new Date().toISOString();
        const req: VerificationRequest = {
          id: `vr_${Date.now().toString(36)}`,
          petId,
          method,
          status: 'submitted',
          submittedAt: now,
          updatedAt: now,
          note,
        };
        verificationDb.unshift(req);
        return { data: req };
      },
      invalidatesTags: (_r, _e, { petId }) => [{ type: 'Verification', id: petId }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPassportQuery,
  useRequestVerificationMutation,
  useGetTwinSnapshotQuery,
  useGetTwinHistoryQuery,
  useLookupPassportQuery,
  useGetVerificationHistoryQuery,
  useSubmitVerificationRequestMutation,
} = platformApi;
