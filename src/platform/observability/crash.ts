import { logger } from './logger';

export interface CrashReporter {
  captureException(error: unknown, context?: Record<string, unknown>): void;
  setUser(id: string | null): void;
  addBreadcrumb(message: string, data?: Record<string, unknown>): void;
}

const log = logger.scope('crash');

const consoleReporter: CrashReporter = {
  captureException: (e, c) => log.error(e instanceof Error ? e.message : String(e), c),
  setUser: () => undefined,
  addBreadcrumb: (m, d) => log.debug(`breadcrumb ${m}`, d),
};

let reporter: CrashReporter = consoleReporter;

/** Register Sentry / Crashlytics adapter here. */
export const crash = {
  use(r: CrashReporter) {
    reporter = r;
  },
  captureException: (e: unknown, c?: Record<string, unknown>) => reporter.captureException(e, c),
  setUser: (id: string | null) => reporter.setUser(id),
  breadcrumb: (m: string, d?: Record<string, unknown>) => reporter.addBreadcrumb(m, d),
};

type GlobalErrorUtils = {
  setGlobalHandler: (h: (e: unknown, isFatal?: boolean) => void) => void;
  getGlobalHandler: () => (e: unknown, isFatal?: boolean) => void;
};

/** Hooks the RN global handler so uncaught JS errors reach the crash reporter. */
export function installGlobalErrorHandler() {
  const utils = (globalThis as unknown as { ErrorUtils?: GlobalErrorUtils }).ErrorUtils;
  if (!utils) return;
  const previous = utils.getGlobalHandler();
  utils.setGlobalHandler((error, isFatal) => {
    crash.captureException(error, { fatal: !!isFatal });
    previous(error, isFatal);
  });
}
