export type PaymentRequestStatus = 'draft' | 'open' | 'paid' | 'expired';

export interface PaymentRequestRecord {
  id: string;
  customerEmail: string;
  customerName?: string;
  amountUsd: number;
  currency: 'USD';
  description: string;
  status: PaymentRequestStatus;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
  couponCode?: string;
  stripeSessionId?: string;
  stripePaymentStatus?: string;
  usdcVerification?: {
    txHash: string;
    status: 'verified' | 'pending' | 'failed';
    verifiedAt?: string;
    fromAddress?: string;
  };
}