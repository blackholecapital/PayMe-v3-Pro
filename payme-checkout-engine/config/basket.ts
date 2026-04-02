import type { BasketItem } from '../types/basket';

export const SEED_BASKET_ITEMS: BasketItem[] = [
  {
    id: 'item-api-pro',
    name: 'API Pro Plan',
    description: 'Monthly API access -- 50 000 calls',
    unitPrice: 49,
    qty: 1,
    currency: 'usd',
  },
  {
    id: 'item-extra-seat',
    name: 'Extra Team Seat',
    description: 'Additional user licence',
    unitPrice: 12,
    qty: 3,
    currency: 'usd',
  },
  {
    id: 'item-support',
    name: 'Priority Support Add-on',
    description: '24/7 priority email & chat',
    unitPrice: 29,
    qty: 1,
    currency: 'usd',
  },
];
