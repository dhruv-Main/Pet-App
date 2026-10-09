import { logger } from './logger';

export interface AnalyticsProvider {
  track(event: string, props?: Record<string, unknown>): void;
  screen(name: string, props?: Record<string, unknown>): void;
  identify(userId: string | null): void;
}

const log = logger.scope('analytics');

/** Default provider logs only. Swap with Segment / Amplitude / Firebase via `analytics.use`. */
const logProvider: AnalyticsProvider = {
  track: (e, p) => log.debug(`track ${e}`, p),
  screen: (n, p) => log.debug(`screen ${n}`, p),
  identify: (id) => log.debug('identify', { userId: id ?? 'anonymous' }),
};

class Analytics {
  private providers = new Set<AnalyticsProvider>([logProvider]);
  private enabled = true;

  use(provider: AnalyticsProvider) {
    this.providers.add(provider);
    return () => this.providers.delete(provider);
  }
  /** Gate on consent: call with false when the user revokes analytics consent. */
  setEnabled(v: boolean) {
    this.enabled = v;
  }
  track(event: string, props?: Record<string, unknown>) {
    this.fan((p) => p.track(event, props));
  }
  screen(name: string, props?: Record<string, unknown>) {
    this.fan((p) => p.screen(name, props));
  }
  identify(userId: string | null) {
    this.fan((p) => p.identify(userId));
  }
  private fan(fn: (p: AnalyticsProvider) => void) {
    if (!this.enabled) return;
    this.providers.forEach((p) => {
      try {
        fn(p);
      } catch (e) {
        log.warn('provider failed', { error: String(e) });
      }
    });
  }
}

export const analytics = new Analytics();
