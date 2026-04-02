import type { BasketItem, BasketTotals } from '../types/basket';

/** Compute basket totals from items + optional coupon discount. */
export function computeBasketTotals(
  items: BasketItem[],
  couponAmountOff: number = 0,
): BasketTotals {
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
  const discount = Math.min(couponAmountOff, subtotal);
  return {
    subtotal,
    discount,
    total: Math.max(0, subtotal - discount),
    itemCount: items.reduce((sum, i) => sum + i.qty, 0),
    hasSubscription: items.some((i) => !!i.subscription && i.qty > 0),
  };
}
