import type { SubscriptionOffer } from '../types/subscription';

const SUBS_KEY = 'payme_engine_subscriptions_v1';

const INTERVAL_LABELS: Record<string, string> = {
  monthly: '/mo',
  '6_months': '/6 mo',
  annually: '/yr',
};

export function intervalLabel(interval: string): string {
  return INTERVAL_LABELS[interval] || `/${interval}`;
}

const seedSubscriptions: SubscriptionOffer[] = [
  {
    id: 'sub_pro_monthly',
    name: 'Pro Plan',
    price: 29,
    currency: 'usd',
    interval: 'monthly',
    description: 'Full API access, 50k calls/mo',
    stripePriceId: '',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'sub_team_annual',
    name: 'Team Plan',
    price: 249,
    currency: 'usd',
    interval: 'annually',
    description: '5 seats, priority support',
    stripePriceId: '',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function read(): SubscriptionOffer[] | null {
  try {
    const raw = localStorage.getItem(SUBS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(data: SubscriptionOffer[]) {
  localStorage.setItem(SUBS_KEY, JSON.stringify(data));
  return data;
}

export function listSubscriptions(): SubscriptionOffer[] {
  const existing = read();
  if (existing) return existing;
  write(seedSubscriptions);
  return [...seedSubscriptions];
}

export function saveSubscriptions(subs: SubscriptionOffer[]) {
  return write(subs);
}

export function addSubscription(sub: Omit<SubscriptionOffer, 'id' | 'createdAt' | 'updatedAt'>): SubscriptionOffer {
  const all = listSubscriptions();
  const newSub: SubscriptionOffer = {
    ...sub,
    id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  all.push(newSub);
  write(all);
  return newSub;
}

export function updateSubscription(id: string, patch: Partial<SubscriptionOffer>) {
  const all = listSubscriptions();
  const idx = all.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  all[idx] = { ...all[idx], ...patch, updatedAt: new Date().toISOString() };
  write(all);
  return all[idx];
}

export function deleteSubscription(id: string) {
  const all = listSubscriptions().filter((s) => s.id !== id);
  write(all);
  return all;
}
