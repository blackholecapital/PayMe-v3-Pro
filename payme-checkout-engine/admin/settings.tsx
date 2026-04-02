import React, { useState } from 'react';
import { getSettings, saveSettings } from '../lib/storage';

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
      <input
        type="checkbox"
        className="payme-toggle"
        checked={checked}
        onChange={onChange}
      />
      <span style={{ fontWeight: 600, fontSize: 14 }}>{label}</span>
    </label>
  );
}

const sectionLabel = { fontSize: 13, fontWeight: 600, color: '#5f6c7b', marginBottom: 8, textTransform: 'uppercase' as const, letterSpacing: '.04em' };
const disabledInputStyle = { background: '#d1d5db', color: '#9ca3af', pointerEvents: 'none' as const };

export default function SettingsAdmin() {
  const [form, setForm] = useState(getSettings());
  const [saved, setSaved] = useState('');

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = () => {
    saveSettings(form);
    setSaved('Saved');
    setTimeout(() => setSaved(''), 2000);
  };

  const stripeOff = !form.stripeEnabled;
  const usdcOff = !form.usdcEnabled;
  const paypalOff = !form.paypalEnabled;
  const venmoOff = !form.venmoEnabled;

  return (
    <div>
      <h2 style={{ color: '#2f7df6' }}>Settings</h2>

      {/* Payment method toggles — row 1 */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 12, flexWrap: 'wrap' }}>
        <Toggle
          checked={Boolean(form.stripeEnabled)}
          onChange={(e) => {
            const on = e.target.checked;
            const patch: any = { stripeEnabled: on };
            if (!on) {
              patch.applePayEnabled = false;
              patch.googlePayEnabled = false;
            }
            setForm((prev) => ({ ...prev, ...patch }));
          }}
          label="Stripe"
        />
        <Toggle
          checked={Boolean(form.usdcEnabled)}
          onChange={(e) => update('usdcEnabled', e.target.checked)}
          label="USDC"
        />
        <Toggle
          checked={Boolean(form.applePayEnabled)}
          onChange={(e) => update('applePayEnabled', form.stripeEnabled ? e.target.checked : false)}
          label="Apple Pay"
        />
      </div>
      {/* Payment method toggles — row 2 */}
      <div style={{ display: 'flex', gap: 32, marginBottom: 24, flexWrap: 'wrap' }}>
        <Toggle
          checked={Boolean(form.paypalEnabled)}
          onChange={(e) => update('paypalEnabled', e.target.checked)}
          label="PayPal"
        />
        <Toggle
          checked={Boolean(form.venmoEnabled)}
          onChange={(e) => update('venmoEnabled', e.target.checked)}
          label="Venmo"
        />
        <Toggle
          checked={Boolean(form.googlePayEnabled)}
          onChange={(e) => update('googlePayEnabled', form.stripeEnabled ? e.target.checked : false)}
          label="Google Pay"
        />
      </div>

      {/* Stripe settings — always visible */}
      <div style={sectionLabel}>Stripe</div>
      <div className="payme-admin-grid">
        <label>
          <span>Stripe price id</span>
          <input
            value={form.stripePriceId || ''}
            onChange={(e) => update('stripePriceId', e.target.value)}
            placeholder="price_xxx"
            style={stripeOff ? disabledInputStyle : undefined}
            tabIndex={stripeOff ? -1 : undefined}
          />
        </label>
        <label>
          <span>Stripe mode</span>
          <select
            value={form.stripeMode || 'payment'}
            onChange={(e) => update('stripeMode', e.target.value)}
            style={stripeOff ? disabledInputStyle : undefined}
            tabIndex={stripeOff ? -1 : undefined}
          >
            <option value="payment">One-time payment</option>
            <option value="subscription">Subscription</option>
          </select>
        </label>
      </div>

      {/* USDC settings — always visible */}
      <div style={sectionLabel}>USDC</div>
      <div className="payme-admin-grid">
        <label>
          <span>USDC wallet (Base)</span>
          <input
            value={form.usdcWallet || ''}
            onChange={(e) => update('usdcWallet', e.target.value)}
            placeholder="0x..."
            style={usdcOff ? disabledInputStyle : undefined}
            tabIndex={usdcOff ? -1 : undefined}
          />
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>1% transaction fee applies</div>
        </label>
      </div>

      {/* PayPal / Venmo — always visible */}
      <div style={{ ...sectionLabel, marginTop: 16 }}>PayPal / Venmo (manual)</div>
      <div className="payme-admin-grid">
        <label>
          <span>PayPal handle</span>
          <input
            value={form.paypalHandle || ''}
            onChange={(e) => update('paypalHandle', e.target.value)}
            placeholder="@yourpaypal or email"
            style={paypalOff ? disabledInputStyle : undefined}
            tabIndex={paypalOff ? -1 : undefined}
          />
        </label>
        <label>
          <span>Venmo handle</span>
          <input
            value={form.venmoHandle || ''}
            onChange={(e) => update('venmoHandle', e.target.value)}
            placeholder="@yourvenmo"
            style={venmoOff ? disabledInputStyle : undefined}
            tabIndex={venmoOff ? -1 : undefined}
          />
        </label>
      </div>

      {/* Branding */}
      <div style={{ ...sectionLabel, marginTop: 16 }}>Branding</div>
      <div className="payme-admin-grid">
        <label><span>Company name</span><input value={form.companyName || ''} onChange={(e) => update('companyName', e.target.value)} /></label>
        <label><span>Footer text</span><input value={form.footerText || ''} onChange={(e) => update('footerText', e.target.value)} /></label>
      </div>

      <button
        type="button"
        onClick={handleSave}
        style={{ background: '#2f7df6', color: '#fff', border: 0, padding: '12px 24px', borderRadius: 12, fontWeight: 600 }}
      >
        Save settings
      </button>
      {saved && <span style={{ marginLeft: 12, color: '#166534', fontWeight: 600 }}>{saved}</span>}
    </div>
  );
}
