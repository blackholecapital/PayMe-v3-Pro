import React, { useState } from 'react';
import { useIsMobile } from '../lib/useIsMobile';
import { SEED_BASKET_ITEMS } from '../config/basket';
import { computeBasketTotals } from '../lib/basket';
import { validateCoupon } from '../lib/coupons';
import { listSubscriptions, intervalLabel } from '../lib/subscriptions';
import PoweredByPayMe from './PoweredByPayMe';
import type { BasketItem } from '../types/basket';

interface Props {
  onProceedToCheckout: (totals: {
    subtotal: number;
    discount: number;
    total: number;
    description: string;
    hasSubscription: boolean;
    subscriptionItems?: BasketItem[];
    onetimeItems?: BasketItem[];
  }) => void;
}

export default function BasketDemo({ onProceedToCheckout }: Props) {
  const isMobile = useIsMobile();
  const [items, setItems] = useState<BasketItem[]>(() =>
    SEED_BASKET_ITEMS.map((i) => ({ ...i })),
  );
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<{ code: string; valid: boolean; amountOff: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState('');

  const totals = computeBasketTotals(items, coupon?.amountOff ?? 0);
  const availableSubs = listSubscriptions().filter((s) => s.active);

  const updateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, qty: Math.max(0, item.qty + delta) } : item,
      ),
    );
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const addSubscriptionToBasket = (sub: any) => {
    if (items.some((i) => i.id === sub.id)) return;
    setItems((prev) => [
      ...prev,
      {
        id: sub.id,
        name: sub.name,
        description: `${sub.description || 'Subscription'} (${sub.interval})`,
        unitPrice: sub.price,
        qty: 1,
        currency: 'usd',
        subscription: {
          interval: sub.interval,
          stripePriceId: sub.stripePriceId,
        },
      },
    ]);
  };

  const handleApplyCoupon = () => {
    const result = validateCoupon({ code: couponCode, subtotal: totals.subtotal });
    setCouponMsg(result.message || '');
    if (result.valid) {
      setCoupon({ code: couponCode, valid: true, amountOff: Number(result.amountOff) });
    } else {
      setCoupon(null);
    }
  };

  const handleProceed = () => {
    const activeItems = items.filter((i) => i.qty > 0);
    const description = activeItems.map((i) => `${i.name} x${i.qty}`).join(', ');
    onProceedToCheckout({
      subtotal: totals.subtotal,
      discount: totals.discount,
      total: totals.total,
      description: description || 'Basket order',
      hasSubscription: totals.hasSubscription,
      subscriptionItems: activeItems.filter((i) => !!i.subscription),
      onetimeItems: activeItems.filter((i) => !i.subscription),
    });
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '16px 6px 48px' : '32px 16px 64px', color: '#111827' }}>
      <div style={{ background: '#fff', borderRadius: isMobile ? 16 : 24, padding: isMobile ? 16 : 28, boxShadow: '0 4px 24px rgba(47,125,246,.10), 0 16px 40px rgba(10,37,64,.06)' }}>
        <h1 style={{ margin: '0 0 4px', fontSize: 28, color: '#2f7df6' }}>Your basket</h1>
        <p style={{ color: '#5f6c7b', margin: '0 0 24px', fontSize: 15 }}>Review items before checkout.</p>

        {items.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: '#5f6c7b' }}>
            Basket is empty.
          </div>
        )}

        {items.map((item) => (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              padding: '14px 0',
              borderBottom: '1px solid #eef1f5',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>
                {item.name}
                {item.subscription && (
                  <span style={{ fontSize: 11, color: '#2f7df6', marginLeft: 8, fontWeight: 400 }}>
                    {intervalLabel(item.subscription.interval)}
                  </span>
                )}
              </div>
              {item.description && (
                <div style={{ fontSize: 13, color: '#5f6c7b', marginTop: 2 }}>{item.description}</div>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                type="button"
                onClick={() => updateQty(item.id, -1)}
                style={{ width: 30, height: 30, padding: 0, borderRadius: 8, border: '1px solid #d5dce5', background: '#f9fafb', fontSize: 16, lineHeight: '28px' }}
              >
                −
              </button>
              <span style={{ width: 28, textAlign: 'center', fontWeight: 600 }}>{item.qty}</span>
              <button
                type="button"
                onClick={() => updateQty(item.id, 1)}
                style={{ width: 30, height: 30, padding: 0, borderRadius: 8, border: '1px solid #d5dce5', background: '#f9fafb', fontSize: 16, lineHeight: '28px' }}
              >
                +
              </button>
            </div>

            <div style={{ width: 70, textAlign: 'right', fontWeight: 600 }}>
              ${(item.unitPrice * item.qty).toFixed(2)}
            </div>

            <button
              type="button"
              onClick={() => removeItem(item.id)}
              style={{ background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 18, padding: '0 4px' }}
              title="Remove"
            >
              ×
            </button>
          </div>
        ))}

        {/* Add subscription offers */}
        {availableSubs.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8, color: '#5f6c7b' }}>Add a subscription</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {availableSubs.map((sub) => {
                const alreadyAdded = items.some((i) => i.id === sub.id);
                return (
                  <button
                    key={sub.id}
                    type="button"
                    disabled={alreadyAdded}
                    onClick={() => addSubscriptionToBasket(sub)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 10,
                      border: '1px solid #d5dce5',
                      background: alreadyAdded ? '#f3f4f6' : '#eff6ff',
                      color: alreadyAdded ? '#9ca3af' : '#2f7df6',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: alreadyAdded ? 'default' : 'pointer',
                    }}
                  >
                    + {sub.name} (${sub.price}{intervalLabel(sub.interval)})
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Coupon */}
        <div style={{ marginTop: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600, fontSize: 14 }}>Coupon code</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Enter code"
              style={{ flex: 1, padding: '12px 14px', border: '1px solid #d5dce5', borderRadius: 12 }}
            />
            <button
              type="button"
              onClick={handleApplyCoupon}
              style={{ padding: '12px 16px', borderRadius: 12, border: 0, background: '#2f7df6', color: '#fff', fontWeight: 600 }}
            >
              Apply
            </button>
          </div>
          {couponMsg && (
            <div style={{ marginTop: 8, fontSize: 13, color: coupon?.valid ? '#166534' : '#6b7280' }}>
              {couponMsg}
            </div>
          )}
        </div>

        {/* Totals */}
        <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #e5ebf2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 15 }}>
            <span style={{ color: '#5f6c7b' }}>Subtotal ({totals.itemCount} items)</span>
            <span>${totals.subtotal.toFixed(2)}</span>
          </div>
          {totals.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 15, color: '#166534' }}>
              <span>Discount</span>
              <span>- ${totals.discount.toFixed(2)}</span>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontWeight: 800,
              fontSize: 22,
              paddingTop: 10,
              borderTop: totals.discount > 0 ? '1px solid #e5ebf2' : 'none',
            }}
          >
            <span>Estimated total</span>
            <span>${totals.total.toFixed(2)}</span>
          </div>
          {totals.hasSubscription && (
            <div style={{ fontSize: 12, color: '#2f7df6', marginTop: 6 }}>
              Includes recurring subscription item(s)
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleProceed}
          disabled={items.every((i) => i.qty === 0)}
          style={{
            width: '100%',
            marginTop: 24,
            padding: 16,
            borderRadius: 16,
            border: 0,
            background: '#2f7df6',
            color: '#fff',
            fontWeight: 700,
            fontSize: 16,
            opacity: items.every((i) => i.qty === 0) ? 0.5 : 1,
          }}
        >
          Proceed to checkout
        </button>

        <PoweredByPayMe />
      </div>
    </div>
  );
}
