export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogSink {
  write(level: LogLevel, scope: string, message: string, meta?: Record<string, unknown>): void;
}

const ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

const consoleSink: LogSink = {
  write(level, scope, message, meta) {
    const line = `[${scope}] ${message}`;
    // eslint-disable-next-line no-console
    (level === 'debug' ? console.log : console[level])(line, meta ?? '');
  },
};

const PII_KEYS = /(token|password|email|phone|microchip|secret)/i;

function redact(meta?: Record<string, unknown>) {
  if (!meta) return undefined;
  return Object.fromEntries(
    Object.entries(meta).map(([k, v]) => [k, PII_KEYS.test(k) ? '[redacted]' : v])
  );
}

class Logger {
  private sinks = new Set<LogSink>([consoleSink]);
  private min: LogLevel = __DEV__ ? 'debug' : 'warn';

  setLevel(level: LogLevel) {
    this.min = level;
  }
  addSink(sink: LogSink) {
    this.sinks.add(sink);
    return () => this.sinks.delete(sink);
  }
  scope(name: string) {
    return {
      debug: (m: string, meta?: Record<string, unknown>) => this.log('debug', name, m, meta),
      info: (m: string, meta?: Record<string, unknown>) => this.log('info', name, m, meta),
      warn: (m: string, meta?: Record<string, unknown>) => this.log('warn', name, m, meta),
      error: (m: string, meta?: Record<string, unknown>) => this.log('error', name, m, meta),
    };
  }
  private log(level: LogLevel, scope: string, message: string, meta?: Record<string, unknown>) {
    if (ORDER[level] < ORDER[this.min]) return;
    const safe = redact(meta);
    this.sinks.forEach((s) => {
      try {
        s.write(level, scope, message, safe);
      } catch {
        // sinks must never throw into app code
      }
    });
  }
}

export const logger = new Logger();
