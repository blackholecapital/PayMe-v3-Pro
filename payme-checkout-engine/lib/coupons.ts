import { getCoupons, saveCoupons } from './storage';

function now() {
  return new Date().toISOString();
}

export function listCoupons() {
  return getCoupons();
}

export function upsertCoupon(input) {
  const coupons = getCoupons();
  const normalized = {
    id: input.id || `coupon_${Math.random().toString(36).slice(2, 10)}`,
    code: String(input.code || '').trim().toUpperCase(),
    type: input.type === 'fixed' ? 'fixed' : 'percent',
    value: Number(input.value || 0),
    active: Boolean(input.active),
    expiry: input.expiry || '',
    maxUses: input.maxUses ? Number(input.maxUses) : 0,
    usageCount: Number(input.usageCount || 0),
    createdAt: input.createdAt || now(),
    updatedAt: now(),
  };
  const next = coupons.filter((item) => item.id !== normalized.id && item.code !== normalized.code);
  next.unshift(normalized);
  saveCoupons(next);
  return normalized;
}

export function removeCoupon(id) {
  const next = getCoupons().filter((item) => item.id !== id);
  saveCoupons(next);
  return next;
}

export function validateCoupon({ code, subtotal }) {
  const normalizedCode = String(code || '').trim().toUpperCase();
  if (!normalizedCode) return { valid: false, amountOff: 0, message: 'Enter a coupon code.' };
  const coupon = getCoupons().find((item) => item.code === normalizedCode);
  if (!coupon) return { valid: false, amountOff: 0, message: 'Coupon not found.' };
  if (!coupon.active) return { valid: false, amountOff: 0, message: 'Coupon is inactive.' };
  if (coupon.expiry && new Date(coupon.expiry).getTime() < Date.now()) {
    return { valid: false, amountOff: 0, message: 'Coupon expired.' };
  }
  if (coupon.maxUses && coupon.usageCount >= coupon.maxUses) {
    return { valid: false, amountOff: 0, message: 'Coupon max uses reached.' };
  }
  const amountOff = coupon.type === 'percent'
    ? Number((subtotal * (coupon.value / 100)).toFixed(2))
    : Math.min(subtotal, Number(coupon.value.toFixed ? coupon.value.toFixed(2) : coupon.value));
  return { valid: true, code: normalizedCode, coupon, amountOff, message: 'Coupon applied.' };
}

export function incrementCouponUsage(code) {
  const normalizedCode = String(code || '').trim().toUpperCase();
  if (!normalizedCode) return null;
  const next = getCoupons().map((item) => item.code === normalizedCode
    ? { ...item, usageCount: Number(item.usageCount || 0) + 1, updatedAt: now() }
    : item
  );
  saveCoupons(next);
  return next.find((item) => item.code === normalizedCode) || null;
}