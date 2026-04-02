import React, { useState } from 'react';
import {
  listSubscriptions,
  addSubscription,
  updateSubscription,
  deleteSubscription,
} from '../lib/subscriptions';
import type { SubscriptionOffer, SubscriptionInterval } from '../types/subscription';

const INTERVALS: { value: SubscriptionInterval; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: '6_months', label: 'Every 6 months' },
  { value: 'annually', label: 'Annually' },
];

const emptyForm = {
  name: '',
  price: '',
  interval: 'monthly' as SubscriptionInterval,
  description: '',
  stripePriceId: '',
  active: true,
};

export default function SubscriptionsAdmin() {
  const [subs, setSubs] = useState<SubscriptionOffer[]>(() => listSubscriptions());
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);

  const handleSave = () => {
    if (!form.name || !form.price) return;
    if (editId) {
      updateSubscription(editId, {
        name: form.name,
        price: Number(form.price),
        interval: form.interval,
        description: form.description,
        stripePriceId: form.stripePriceId,
        active: form.active,
      });
      setEditId(null);
    } else {
      addSubscription({
        name: form.name,
        price: Number(form.price),
        currency: 'usd',
        interval: form.interval,
        description: form.description,
        stripePriceId: form.stripePriceId,
        active: form.active,
      });
    }
    setForm(emptyForm);
    setSubs(listSubscriptions());
  };

  const startEdit = (s: SubscriptionOffer) => {
    setEditId(s.id);
    setForm({
      name: s.name,
      price: String(s.price),
      interval: s.interval,
      description: s.description || '',
      stripePriceId: s.stripePriceId,
      active: s.active,
    });
  };

  const handleDelete = (id: string) => {
    deleteSubscription(id);
    setSubs(listSubscriptions());
    if (editId === id) { setEditId(null); setForm(emptyForm); }
  };

  return (
    <div>
      <h2 style={{ color: '#2f7df6' }}>Subscriptions</h2>

      {/* Form */}
      <div className="payme-admin-grid" style={{ marginBottom: 20 }}>
        <label><span>Name</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Pro Plan" /></label>
        <label><span>Price (USD)</span><input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></label>
        <label>
          <span>Interval</span>
          <select value={form.interval} onChange={(e) => setForm({ ...form, interval: e.target.value as SubscriptionInterval })}>
            {INTERVALS.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
        </label>
        <label><span>Stripe recurring price ID</span><input value={form.stripePriceId} onChange={(e) => setForm({ ...form, stripePriceId: e.target.value })} placeholder="price_xxx" /></label>
        <label><span>Description</span><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} style={{ width: 'auto' }} />
          <span style={{ marginBottom: 0 }}>Active</span>
        </label>
      </div>
      <button type="button" onClick={handleSave} style={{ background: '#2f7df6', color: '#fff', border: 0, padding: '10px 20px', borderRadius: 12, fontWeight: 600, marginBottom: 24 }}>
        {editId ? 'Update subscription' : 'Create subscription'}
      </button>
      {editId && (
        <button type="button" onClick={() => { setEditId(null); setForm(emptyForm); }} style={{ marginLeft: 8, padding: '10px 20px', borderRadius: 12 }}>
          Cancel
        </button>
      )}

      {/* List */}
      {subs.length === 0 && <p style={{ color: '#5f6c7b' }}>No subscriptions yet.</p>}
      {subs.map((s) => (
        <div key={s.id} style={{ border: '1px solid #dbe3ee', borderRadius: 14, padding: 14, marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>{s.name}</strong>
            <span style={{ color: '#5f6c7b', marginLeft: 8 }}>
              ${s.price}/{s.interval === '6_months' ? '6mo' : s.interval === 'annually' ? 'yr' : 'mo'}
            </span>
            {!s.active && <span style={{ marginLeft: 8, color: '#9ca3af', fontSize: 12 }}>(inactive)</span>}
            {s.description && <div style={{ fontSize: 13, color: '#5f6c7b', marginTop: 4 }}>{s.description}</div>}
            {s.stripePriceId && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Stripe: {s.stripePriceId}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => startEdit(s)} style={{ fontSize: 13, padding: '6px 12px', borderRadius: 8 }}>Edit</button>
            <button type="button" onClick={() => handleDelete(s.id)} style={{ fontSize: 13, padding: '6px 12px', borderRadius: 8, color: '#dc2626' }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  );
}
