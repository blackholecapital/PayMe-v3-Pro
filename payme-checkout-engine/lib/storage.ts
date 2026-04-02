const SETTINGS_KEY = 'payme_engine_settings_v1';
const REQUESTS_KEY = 'payme_engine_requests_v1';
const COUPONS_KEY = 'payme_engine_coupons_v1';

const seedSettings = {
  stripeEnabled: true,
  stripePublishableKey: '',
  stripeSecretKey: '',
  stripeWebhookSecret: '',
  stripePriceId: '',
  stripeMode: 'payment',
  usdcEnabled: true,
  crmWebhookUrl: '',
  crmApiKey: '',
  usdcWallet: (import.meta.env.VITE_RECEIVING_ADDRESS || '').trim(),
  applePayEnabled: true,
  googlePayEnabled: true,
  paypalEnabled: true,
  venmoEnabled: true,
  paypalHandle: '',
  venmoHandle: '',
  footerText: 'Powered by PayMe',
  companyName: 'PayMe',
  productName: 'PayMe Payment Request',
  productDescription: 'Simple hosted checkout with card or Base USDC.',
  unitAmountUsd: 99,
};

const seedCoupons = [
  {
    id: 'coupon_welcome10',
    code: 'WELCOME10',
    type: 'percent',
    value: 10,
    active: true,
    expiry: '',
    maxUses: 100,
    usageCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const seedRequests = [
  {
    id: 'req_demo_001',
    customerEmail: 'customer@example.com',
    customerName: 'Demo Buyer',
    amountUsd: 99,
    currency: 'USD',
    description: 'Demo payment request',
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    dueDate: '',
    couponCode: '',
  },
];

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
  return value;
}

export function getSettings() {
  const current = read(SETTINGS_KEY, null);
  if (current) return { ...seedSettings, ...current };
  write(SETTINGS_KEY, seedSettings);
  return { ...seedSettings };
}

export function saveSettings(patch) {
  const next = { ...getSettings(), ...patch };
  write(SETTINGS_KEY, next);
  return next;
}

export function getCoupons() {
  const current = read(COUPONS_KEY, null);
  if (current) return current;
  write(COUPONS_KEY, seedCoupons);
  return [...seedCoupons];
}

export function saveCoupons(coupons) {
  return write(COUPONS_KEY, coupons);
}

export function getPaymentRequests() {
  const current = read(REQUESTS_KEY, null);
  if (current) return current;
  write(REQUESTS_KEY, seedRequests);
  return [...seedRequests];
}

export function savePaymentRequests(requests) {
  return write(REQUESTS_KEY, requests);
}