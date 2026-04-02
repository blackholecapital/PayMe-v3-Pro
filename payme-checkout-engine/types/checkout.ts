export type CheckoutPaymentMethod = 'card' | 'usdc';

export interface CheckoutTotals {
  subtotal: number;
  discount: number;
  total: number;
  currency: 'usd';
}

export interface CheckoutConfig {
  stripeEnabled: boolean;
  stripePublishableKey?: string;
  stripePriceId?: string;
  stripeMode: 'payment' | 'subscription';
  productName: string;
  productDescription: string;
  unitAmountUsd: number;
  usdcWallet: string;
  footerText: string;
}

export interface CheckoutIntent {
  paymentRequestId: string;
  email: string;
  couponCode?: string;
  method: CheckoutPaymentMethod;
  successUrl?: string;
  cancelUrl?: string;
}