import React, { useState } from 'react';
import { listPaymentRequests, upsertPaymentRequest } from '../lib/paymentRequests';

function CopyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

function CheckIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#166534" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function getPaymentLink(requestId: string) {
  const base = window.location.origin + window.location.pathname;
  return `${base}?pay=${requestId}`;
}

export default function PaymentRequestsAdmin() {
  const [requests, setRequests] = useState(listPaymentRequests());
  const [form, setForm] = useState({ customerEmail: '', customerName: '', amountUsd: '99', description: '' });
  const [copiedId, setCopiedId] = useState('');

  const create = () => {
    const next = upsertPaymentRequest(form);
    setRequests(listPaymentRequests());
    setForm({ customerEmail: '', customerName: '', amountUsd: '99', description: '' });
    window.history.replaceState({}, '', `/?request=${next.id}`);
  };

  const copyLink = (id: string) => {
    const link = getPaymentLink(id);
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(''), 2000);
    });
  };

  return (
    <div>
      <h2 style={{ color: '#2f7df6' }}>Payment requests</h2>
      <div className="payme-admin-grid">
        <label><span>Email</span><input value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} /></label>
        <label><span>Name</span><input value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} /></label>
        <label><span>Amount USD</span><input value={form.amountUsd} onChange={(e) => setForm({ ...form, amountUsd: e.target.value })} /></label>
        <label><span>Description</span><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
      </div>
      <button type="button" onClick={create}>Create request</button>
      <div style={{ marginTop: 16 }}>
        {requests.map((req) => {
          const isPaid = req.status === 'paid';
          const txHash = req.usdcVerification?.txHash || '';
          const paymentLink = getPaymentLink(req.id);
          const txUrl = txHash ? `https://basescan.org/tx/${txHash}` : '';

          return (
            <div key={req.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', border: '1px solid #dbe3ee', borderRadius: 12, marginBottom: 8, gap: 12 }}>
              {/* Left: request info */}
              <span style={{ fontSize: 14 }}>
                {req.id} · {req.customerEmail} · ${Number(req.amountUsd).toFixed(2)} ·{' '}
                {isPaid ? (
                  <span style={{ color: '#166534', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <CheckIcon size={14} /> PAID
                  </span>
                ) : (
                  <span style={{ color: '#5f6c7b' }}>{req.status}</span>
                )}
              </span>

              {/* Right: link or receipt */}
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                {isPaid && txHash ? (
                  <>
                    <a
                      href={txUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 13, color: '#2f7df6', fontWeight: 600, textDecoration: 'underline', whiteSpace: 'nowrap' }}
                    >
                      Payment receipt
                    </a>
                    <button
                      type="button"
                      onClick={() => { navigator.clipboard.writeText(txUrl); setCopiedId(req.id); setTimeout(() => setCopiedId(''), 2000); }}
                      title="Copy transaction link"
                      style={{ display: 'inline-flex', padding: 0, border: 'none', background: 'transparent', color: copiedId === req.id ? '#166534' : '#5f6c7b', cursor: 'pointer' }}
                    >
                      <CopyIcon size={16} />
                    </button>
                  </>
                ) : isPaid ? (
                  <span style={{ fontSize: 13, color: '#166534', fontWeight: 600 }}>Paid via Stripe</span>
                ) : (
                  <>
                    <a
                      href={paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: 13, color: '#2f7df6', textDecoration: 'underline', whiteSpace: 'nowrap' }}
                    >
                      Payment request link
                    </a>
                    <button
                      type="button"
                      onClick={() => copyLink(req.id)}
                      title="Copy payment link"
                      style={{
                        display: 'inline-flex', alignItems: 'center',
                        padding: 0, border: 'none', background: 'transparent',
                        color: copiedId === req.id ? '#166534' : '#5f6c7b',
                        cursor: 'pointer', flexShrink: 0,
                      }}
                    >
                      <CopyIcon size={16} />
                    </button>
                  </>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
