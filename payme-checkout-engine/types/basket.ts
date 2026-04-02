import type { SubscriptionInterval } from './subscription';

export interface BasketItem {
  id: string;
  name: string;
  description?: string;
  unitPrice: number;
  qty: number;
  currency: 'usd';
  /** If set, item is a recurring subscription. */
  subscription?: {
    interval: SubscriptionInterval;
    stripePriceId: string;
  };
}

export interface BasketState {
  items: BasketItem[];
  coupon: { code: string; valid: boolean; amountOff: number } | null;
}

export interface BasketTotals {
  subtotal: number;
  discount: number;
  total: number;
  itemCount: number;
  hasSubscription: boolean;
}
