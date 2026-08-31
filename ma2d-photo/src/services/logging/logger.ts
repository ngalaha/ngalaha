/**
 * Lightweight technical logger (spec section 29).
 *
 * Keeps an in-memory ring buffer (shown on the Diagnostics screen) and
 * mirrors everything to the console. Never shown in normal UI flows —
 * only surfaced deliberately via Administration > Diagnostic.
 */

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, unknown>;
}

const MAX_ENTRIES = 500;
const entries: LogEntry[] = [];
const listeners = new Set<() => void>();

function push(level: LogEntry['level'], message: string, data?: Record<string, unknown>) {
  const entry: LogEntry = { timestamp: new Date().toISOString(), level, message, data };
  entries.unshift(entry);
  if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
  const line = `[MA2D][${level.toUpperCase()}] ${message}`;
  if (level === 'error') console.error(line, data ?? '');
  else if (level === 'warn') console.warn(line, data ?? '');
  else console.log(line, data ?? '');
  listeners.forEach((l) => l());
}

export const logger = {
  info: (message: string, data?: Record<string, unknown>) => push('info', message, data),
  warn: (message: string, data?: Record<string, unknown>) => push('warn', message, data),
  error: (message: string, data?: Record<string, unknown>) => push('error', message, data),
  getEntries: (): LogEntry[] => [...entries],
  subscribe: (listener: () => void): (() => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  clear: () => {
    entries.length = 0;
    listeners.forEach((l) => l());
  },
};
