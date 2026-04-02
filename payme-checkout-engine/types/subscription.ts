export type SubscriptionInterval = 'monthly' | '6_months' | 'annually';

export interface SubscriptionOffer {
  id: string;
  name: string;
  price: number;
  currency: 'usd';
  interval: SubscriptionInterval;
  description?: string;
  stripePriceId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
