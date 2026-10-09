import { eventBus } from '@platform/events';
import { analytics } from './analytics';
import { crash } from './crash';
import { installGlobalErrorHandler } from './crash';

export { logger } from './logger';
export { analytics } from './analytics';
export { crash } from './crash';
export type { AnalyticsProvider } from './analytics';
export type { CrashReporter } from './crash';

let started = false;

/** One-time bootstrap: global error hook and domain-event to analytics bridge. */
export function startObservability() {
  if (started) return;
  started = true;
  installGlobalErrorHandler();
  eventBus.onAny((e) => {
    crash.breadcrumb(e.type, { id: e.id });
    // Payloads can contain identifiers; only the event type and correlation id are tracked.
    analytics.track(e.type, { correlationId: e.correlationId });
  });
}
