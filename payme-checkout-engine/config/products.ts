export const DEFAULT_PRODUCT = {
  id: 'payme-default',
  name: 'PayMe Payment Request',
  description: 'Simple hosted checkout with card or Base USDC.',
  unitAmountUsd: 99,
  currency: 'usd',
};

export function resolveProduct(overrides = {}) {
  return { ...DEFAULT_PRODUCT, ...overrides };
}