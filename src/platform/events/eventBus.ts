import type {
  AnyEventHandler,
  DomainEventMap,
  DomainEventType,
  EventEnvelope,
  EventHandler,
  EventTransport,
} from './contracts';

let seq = 0;
const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${(seq++).toString(36)}`;

export function createEvent<T extends DomainEventType>(
  type: T,
  payload: DomainEventMap[T],
  correlationId?: string
): EventEnvelope<T> {
  return {
    id: newId('evt'),
    type,
    version: 1,
    occurredAt: new Date().toISOString(),
    correlationId: correlationId ?? newId('cor'),
    source: 'mobile',
    payload,
  };
}

/** Bounded in-memory outbox so events survive until a transport is attached. */
const OUTBOX_LIMIT = 200;

export class EventBus {
  private handlers = new Map<DomainEventType, Set<EventHandler<DomainEventType>>>();
  private anyHandlers = new Set<AnyEventHandler>();
  private transports = new Set<EventTransport>();
  private outbox: EventEnvelope[] = [];

  on<T extends DomainEventType>(type: T, handler: EventHandler<T>): () => void {
    const set = this.handlers.get(type) ?? new Set();
    set.add(handler as EventHandler<DomainEventType>);
    this.handlers.set(type, set);
    return () => this.off(type, handler);
  }

  off<T extends DomainEventType>(type: T, handler: EventHandler<T>): void {
    this.handlers.get(type)?.delete(handler as EventHandler<DomainEventType>);
  }

  once<T extends DomainEventType>(type: T, handler: EventHandler<T>): () => void {
    const unsubscribe = this.on(type, (event) => {
      unsubscribe();
      handler(event);
    });
    return unsubscribe;
  }

  onAny(handler: AnyEventHandler): () => void {
    this.anyHandlers.add(handler);
    return () => this.anyHandlers.delete(handler);
  }

  addTransport(transport: EventTransport): () => void {
    this.transports.add(transport);
    // Flush anything produced before the transport was attached.
    this.outbox.forEach((e) => this.safePublish(transport, e));
    return () => this.transports.delete(transport);
  }

  emit<T extends DomainEventType>(
    type: T,
    payload: DomainEventMap[T],
    correlationId?: string
  ): EventEnvelope<T> {
    const event = createEvent(type, payload, correlationId);
    this.outbox.push(event);
    if (this.outbox.length > OUTBOX_LIMIT) this.outbox.shift();

    this.handlers.get(type)?.forEach((h) => this.safeHandle(h, event));
    this.anyHandlers.forEach((h) => this.safeHandle(h, event));
    this.transports.forEach((t) => this.safePublish(t, event));
    return event;
  }

  /** Snapshot for diagnostics / audit surfaces. */
  recent(limit = 20): EventEnvelope[] {
    return this.outbox.slice(-limit).reverse();
  }

  private safeHandle(handler: (e: never) => void, event: EventEnvelope) {
    try {
      (handler as (e: EventEnvelope) => void)(event);
    } catch (err) {
      // A faulty listener must never break the emitter.
      if (__DEV__) console.warn(`[events] handler for ${event.type} failed`, err);
    }
  }

  private safePublish(transport: EventTransport, event: EventEnvelope) {
    try {
      const result = transport.publish(event);
      if (result instanceof Promise) result.catch(() => undefined);
    } catch {
      // transport failures are non-fatal; outbox retains the event
    }
  }
}

export const eventBus = new EventBus();
