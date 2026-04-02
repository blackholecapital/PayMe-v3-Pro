import { getPaymentRequests, savePaymentRequests } from './storage';

function now() {
  return new Date().toISOString();
}

export function listPaymentRequests() {
  return getPaymentRequests();
}

export function getPaymentRequest(id: string) {
  return getPaymentRequests().find((r) => r.id === id) || null;
}

export function upsertPaymentRequest(input) {
  const requests = getPaymentRequests();
  const item = {
    id: input.id || `req_${Math.random().toString(36).slice(2, 10)}`,
    customerEmail: String(input.customerEmail || '').trim(),
    customerName: String(input.customerName || '').trim(),
    amountUsd: Number(input.amountUsd || 0),
    currency: 'USD',
    description: String(input.description || '').trim(),
    status: input.status || 'open',
    dueDate: input.dueDate || '',
    couponCode: String(input.couponCode || '').trim().toUpperCase(),
    stripeSessionId: input.stripeSessionId || '',
    stripePaymentStatus: input.stripePaymentStatus || '',
    usdcVerification: input.usdcVerification || null,
    createdAt: input.createdAt || now(),
    updatedAt: now(),
  };
  const next = requests.filter((req) => req.id !== item.id);
  next.unshift(item);
  savePaymentRequests(next);
  return item;
}

/**
 * Check whether a payment request can be checked out.
 * Returns { allowed: true } or { allowed: false, reason: string }.
 */
export function canCheckout(id: string): { allowed: boolean; reason?: string } {
  const req = getPaymentRequest(id);
  if (!req) return { allowed: false, reason: 'Payment request not found.' };
  if (req.status === 'paid') return { allowed: false, reason: 'This request has already been paid.' };
  if (req.status === 'pending') return { allowed: false, reason: 'A payment is already in progress for this request.' };
  if (req.status === 'expired') return { allowed: false, reason: 'This payment request has expired.' };
  return { allowed: true };
}

/**
 * Transition a request to "pending" when a checkout session is initiated.
 */
export function markPaymentRequestPending(id: string, patch = {}) {
  const next = getPaymentRequests().map((req) =>
    req.id === id ? { ...req, status: 'pending', updatedAt: now(), ...patch } : req,
  );
  savePaymentRequests(next);
  return next.find((req) => req.id === id);
}

export function markPaymentRequestPaid(id: string, patch = {}) {
  const next = getPaymentRequests().map((req) =>
    req.id === id ? { ...req, status: 'paid', paid_at: now(), updatedAt: now(), ...patch } : req,
  );
  savePaymentRequests(next);
  return next.find((req) => req.id === id);
}

/**
 * Reset a pending request back to open (e.g. on checkout cancellation or timeout).
 */
export function resetPaymentRequestToOpen(id: string) {
  const next = getPaymentRequests().map((req) =>
    req.id === id && req.status === 'pending' ? { ...req, status: 'open', updatedAt: now() } : req,
  );
  savePaymentRequests(next);
  return next.find((req) => req.id === id);
}
