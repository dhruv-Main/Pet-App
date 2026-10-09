import { eventBus } from './eventBus';
import type { DomainEventMap } from './contracts';
import type { RiskLevel, TwinSnapshot } from '@apptypes/platform';

/**
 * Typed emitters: the only way features should publish domain events.
 * Keeps payload shape and event naming in one place.
 */
export const emitPetRegistered = (p: DomainEventMap['pet.registered']) =>
  eventBus.emit('pet.registered', p);

export const emitPetVerified = (p: DomainEventMap['pet.verified']) =>
  eventBus.emit('pet.verified', p);

export const emitVaccinationDue = (p: DomainEventMap['health.vaccination.due']) =>
  eventBus.emit('health.vaccination.due', p);

export const emitBookingCreated = (p: DomainEventMap['booking.created']) =>
  eventBus.emit('booking.created', p);

export const emitOrderPlaced = (p: DomainEventMap['order.placed']) =>
  eventBus.emit('order.placed', p);

export const emitConsentUpdated = (p: DomainEventMap['consent.updated']) =>
  eventBus.emit('consent.updated', p);

export const emitLostPetReported = (p: DomainEventMap['pet.lost.reported']) =>
  eventBus.emit('pet.lost.reported', p);

const lastRiskLevel = new Map<string, RiskLevel>();

/** Emits `twin.risk.changed` only when the risk level differs from the last seen snapshot. */
export function trackTwinSnapshot(snapshot: TwinSnapshot): void {
  const previous = lastRiskLevel.get(snapshot.petId);
  lastRiskLevel.set(snapshot.petId, snapshot.risk.level);
  if (previous && previous !== snapshot.risk.level) {
    eventBus.emit('twin.risk.changed', {
      petId: snapshot.petId,
      previous,
      current: snapshot.risk.level,
      modelVersion: snapshot.risk.modelVersion,
    });
  }
}
