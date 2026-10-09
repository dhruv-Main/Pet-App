import { useEffect, useRef } from 'react';
import { eventBus } from './eventBus';
import type { DomainEventType, EventHandler } from './contracts';

/** Subscribe a component to a domain event for its lifetime. */
export function useDomainEvent<T extends DomainEventType>(type: T, handler: EventHandler<T>) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => eventBus.on(type, (e) => ref.current(e)), [type]);
}
