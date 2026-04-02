export type CouponType = 'percent' | 'fixed';

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  active: boolean;
  expiry?: string;
  maxUses?: number;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CouponValidationResult {
  valid: boolean;
  code?: string;
  coupon?: Coupon;
  amountOff: number;
  message?: string;
}