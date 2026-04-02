/**
 * Lightweight payment event logger.
 * Logs to console and persists the last 100 events in localStorage
 * for demo/debug visibility.
 */

const LOG_KEY = 'payme_engine_event_log_v1';
const MAX_ENTRIES = 100;

export type PaymeEventType =
  | 'payment_attempt'
  | 'payment_success'
  | 'payment_failed'
  | 'coupon_applied'
  | 'coupon_rejected'
  | 'checkout_blocked'
  | 'wallet_connected'
  | 'usdc_sent'
  | 'usdc_verified';

export interface PaymeEvent {
  type: PaymeEventType;
  timestamp: string;
  data?: Record<string, any>;
}

function readLog(): PaymeEvent[] {
  try {
    const raw = localStorage.getItem(LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeLog(entries: PaymeEvent[]) {
  localStorage.setItem(LOG_KEY, JSON.stringify(entries.slice(-MAX_ENTRIES)));
}

export function logEvent(type: PaymeEventType, data?: Record<string, any>) {
  const entry: PaymeEvent = {
    type,
    timestamp: new Date().toISOString(),
    data,
  };
  console.log(`[payme:event] ${type}`, data || '');
  const log = readLog();
  log.push(entry);
  writeLog(log);
  return entry;
}

export function getEventLog(): PaymeEvent[] {
  return readLog();
}
