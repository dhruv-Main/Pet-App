import type { AppDispatch } from '@store/store';
import { eventBus } from '@platform/events';
import type { AppNotification } from '@apptypes/platform';
import { mockPets } from '@services/mock/fixtures';
import { notificationAdded } from './notificationsSlice';

const petName = (id?: string) => mockPets.find((p) => p.id === id)?.name ?? 'your pet';

let started = false;

/**
 * Turns domain events into in-app notifications. Idempotent: calling twice
 * (e.g. on fast refresh) will not double subscribe.
 */
export function startNotificationBridge(dispatch: AppDispatch): void {
  if (started) return;
  started = true;

  const push = (n: Omit<AppNotification, 'read' | 'createdAt'> & { createdAt?: string }) =>
    dispatch(notificationAdded({ ...n, read: false, createdAt: n.createdAt ?? new Date().toISOString() }));

  eventBus.on('pet.verified', (e) =>
    push({
      id: e.id,
      category: 'passport',
      severity: 'info',
      title: 'Passport verified',
      body: `${petName(e.payload.petId)} reached ${e.payload.tier.replace('_', ' ')} assurance.`,
      createdAt: e.occurredAt,
      target: { screen: 'Passport', params: { petId: e.payload.petId } },
    }),
  );

  eventBus.on('health.vaccination.due', (e) =>
    push({
      id: e.id,
      category: 'health',
      severity: 'attention',
      title: 'Vaccination due',
      body: `A vaccination for ${petName(e.payload.petId)} is due soon.`,
      createdAt: e.occurredAt,
      target: { screen: 'PetProfile', params: { petId: e.payload.petId } },
    }),
  );

  eventBus.on('twin.risk.changed', (e) =>
    push({
      id: e.id,
      category: 'health',
      severity: e.payload.current === 'high' ? 'critical' : 'attention',
      title: 'Health risk changed',
      body: `${petName(e.payload.petId)} moved from ${e.payload.previous} to ${e.payload.current} risk.`,
      createdAt: e.occurredAt,
      target: { screen: 'TwinDashboard', params: { petId: e.payload.petId } },
    }),
  );

  eventBus.on('agent.action.proposed', (e) =>
    push({
      id: e.id,
      category: 'agent',
      severity: 'attention',
      title: 'Action needs approval',
      body: e.payload.action.title,
      createdAt: e.occurredAt,
      target: { screen: 'AgentCenter' },
    }),
  );

  eventBus.on('agent.action.executed', (e) =>
    push({
      id: e.id,
      category: 'agent',
      severity: 'info',
      title: 'Action completed',
      body: 'An approved action was executed. You can undo it for a short time.',
      createdAt: e.occurredAt,
      target: { screen: 'AgentCenter' },
    }),
  );

  eventBus.on('booking.created', (e) =>
    push({
      id: e.id,
      category: 'booking',
      severity: 'info',
      title: 'Booking confirmed',
      body: `Slot ${e.payload.slot}`,
      createdAt: e.occurredAt,
    }),
  );

  eventBus.on('order.placed', (e) =>
    push({
      id: e.id,
      category: 'commerce',
      severity: 'info',
      title: 'Order placed',
      body: `${e.payload.itemCount} items, INR ${e.payload.total.toLocaleString('en-IN')}`,
      createdAt: e.occurredAt,
    }),
  );

  eventBus.on('consent.updated', (e) =>
    push({
      id: e.id,
      category: 'consent',
      severity: 'info',
      title: 'Consent updated',
      body: `${e.payload.purpose.replace('_', ' ')} sharing ${e.payload.granted ? 'allowed' : 'revoked'}.`,
      createdAt: e.occurredAt,
      target: { screen: 'ConsentCenter' },
    }),
  );
}
