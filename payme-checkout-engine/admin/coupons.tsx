import React, { useState } from 'react';
import { listCoupons, upsertCoupon, removeCoupon } from '../lib/coupons';

export default function CouponsAdmin() {
  const [coupons, setCoupons] = useState(listCoupons());
  const [form, setForm] = useState({ code: '', type: 'percent', value: '10', active: true, expiry: '', maxUses: '' });

  const create = () => {
    upsertCoupon(form);
    setCoupons(listCoupons());
    setForm({ code: '', type: 'percent', value: '10', active: true, expiry: '', maxUses: '' });
  };

  return (
    <div>
      <h2 style={{ color: '#2f7df6' }}>Coupons</h2>
      <div className="payme-admin-grid">
        <label><span>Code</span><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} /></label>
        <label><span>Type</span><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="percent">Percent</option><option value="fixed">Fixed</option></select></label>
        <label><span>Value</span><input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></label>
        <label><span>Expiry</span><input type="date" value={form.expiry} onChange={(e) => setForm({ ...form, expiry: e.target.value })} /></label>
        <label><span>Max uses</span><input value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} /></label>
        <label><span>Active</span><input type="checkbox" checked={Boolean(form.active)} onChange={(e) => setForm({ ...form, active: e.target.checked })} /></label>
      </div>
      <button type="button" onClick={create}>Save coupon</button>
      <div style={{ marginTop: 16 }}>
        {coupons.map((coupon) => (
          <div key={coupon.id} style={{ padding: 12, border: '1px solid #dbe3ee', borderRadius: 12, marginBottom: 8, display:'flex', justifyContent:'space-between' }}>
            <span>{coupon.code} · {coupon.type} · {coupon.value} · uses {coupon.usageCount}/{coupon.maxUses || '∞'}</span>
            <button type="button" onClick={() => { removeCoupon(coupon.id); setCoupons(listCoupons()); }}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}