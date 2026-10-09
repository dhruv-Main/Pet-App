import type {
  AgentAction,
  AssuranceTier,
  ConsentPurpose,
  RiskLevel,
} from '@apptypes/platform';

/**
 * Event contracts. Names follow `domain.entity.verb`; the envelope carries the
 * schema version so a Kafka / schema-registry transport can evolve independently.
 */
export interface DomainEventMap {
  'pet.registered': { petId: string; ownerId: string; species: string };
  'pet.verified': { petId: string; tier: AssuranceTier; verifier?: string };
  'health.vaccination.due': { petId: string; vaccinationId: string; dueAt: string };
  'booking.created': { bookingId: string; providerId: string; petId?: string; slot: string };
  'order.placed': { orderId: string; total: number; itemCount: number };
  'twin.risk.changed': {
    petId: string;
    previous: RiskLevel;
    current: RiskLevel;
    modelVersion: string;
  };
  'consent.updated': { userId: string; purpose: ConsentPurpose; granted: boolean };
  'pet.lost.reported': { petId: string; lastSeen?: { lat: number; lng: number } };
  'agent.action.proposed': { action: AgentAction };
  'agent.action.approved': { actionId: string };
  'agent.action.rejected': { actionId: string };
  'agent.action.executed': { actionId: string };
  'agent.action.undone': { actionId: string };
}

export type DomainEventType = keyof DomainEventMap;

export interface EventEnvelope<T extends DomainEventType = DomainEventType> {
  id: string;
  type: T;
  version: 1;
  occurredAt: string;
  correlationId: string;
  source: 'mobile';
  payload: DomainEventMap[T];
}

export type EventHandler<T extends DomainEventType> = (event: EventEnvelope<T>) => void;
export type AnyEventHandler = (event: EventEnvelope) => void;

/**
 * Transport port. The default implementation is in-memory; swap in an HTTP
 * outbox, WebSocket, or gateway publisher without touching feature code.
 */
export interface EventTransport {
  publish(event: EventEnvelope): void | Promise<void>;
}
