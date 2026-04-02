import React, { useState } from 'react';
import { validateCoupon } from '../lib/coupons';

export default function CouponField({ subtotal, appliedCoupon, onApply }) {
  const [code, setCode] = useState(appliedCoupon?.code || '');
  const [message, setMessage] = useState('');

  const handleApply = () => {
    const result = validateCoupon({ code, subtotal });
    setMessage(result.message || '');
    onApply(result);
  };

  return (
    <div style={{ marginTop: 16 }}>
      <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Coupon</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter code"
          style={{ flex: 1, padding: '12px 14px', border: '1px solid #d5dce5', borderRadius: 12 }}
        />
        <button type="button" onClick={handleApply} style={{ padding: '12px 16px', borderRadius: 12, border: 0, background: '#2f7df6', color: '#fff' }}>
          Apply
        </button>
      </div>
      {message ? <div style={{ marginTop: 8, fontSize: 13, color: appliedCoupon?.valid ? '#166534' : '#6b7280' }}>{message}</div> : null}
    </div>
  );
}
