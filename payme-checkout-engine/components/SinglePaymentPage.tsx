import React, { useMemo, useState } from 'react';
import { useIsMobile } from '../lib/useIsMobile';
import PoweredByPayMe from './PoweredByPayMe';
import PaymentMethodsShowcase from './PaymentMethodsShowcase';
import CouponField from './CouponField';
import { getSettings } from '../lib/storage';
import { resolveBranding } from '../config/branding';
import {
  getPaymentRequest,
  markPaymentRequestPaid,
  markPaymentRequestPending,
  resetPaymentRequestToOpen,
  canCheckout,
} from '../lib/paymentRequests';
import {
  buildStripeCheckoutPayload,
  createHostedCheckoutSession,
  stripeEnabled,
} from '../lib/stripe';
import { createUsdcVerificationPayload, verifyUsdcPayment } from '../lib/usdc';
import { incrementCouponUsage, validateCoupon } from '../lib/coupons';
import { syncCustomerEvent } from '../lib/crm';
import { logEvent } from '../lib/eventLog';
import { splitUsdcPayment } from '../lib/usdcFees';
import { connectWallet, selectNetwork, sendUsdc, wagmiConfig } from '../../src/services/usdcTransfer.js';
import { getAccount } from 'wagmi/actions';
import { BASE_CHAIN_ID, USDC_DECIMALS } from '../../src/config/constants.js';

function CopyIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

const cardBase = {
  background: '#fff',
  borderRadius: 24,
  padding: 24,
  boxShadow: '0 4px 24px rgba(47,125,246,.10), 0 16px 40px rgba(10,37,64,.06)',
  display: 'flex',
  flexDirection: 'column' as const,
};

function SuccessModal({ txHash, total, onDismiss }: { txHash: string; total: number; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);
  const txUrl = `https://basescan.org/tx/${txHash}`;
  const copyTx = () => {
    navigator.clipboard.writeText(txUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)',
      }}
      onClick={onDismiss}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 20, padding: '36px 32px', maxWidth: 420, width: '90%',
          boxShadow: '0 24px 60px rgba(0,0,0,.18)', textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12, color: '#166534' }}>&#10003;</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 22, color: '#166534' }}>Your payment was successful</h2>
        <p style={{ color: '#5f6c7b', fontSize: 14, margin: '0 0 20px' }}>${total.toFixed(2)} USDC paid on Base</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <a
            href={txUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#2f7df6', fontWeight: 600, fontSize: 14, textDecoration: 'underline' }}
          >
            Transaction ID receipt
          </a>
          <button
            type="button"
            onClick={copyTx}
            title="Copy transaction link"
            style={{ display: 'inline-flex', padding: 0, border: 'none', background: 'transparent', color: copied ? '#166534' : '#5f6c7b', cursor: 'pointer' }}
          >
            <CopyIcon size={16} />
          </button>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            marginTop: 24, background: '#2f7df6', color: '#fff', border: 0, borderRadius: 14,
            padding: '14px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer',
          }}
        >
          Done
        </button>
      </div>
    </div>
  );
}

export default function SinglePaymentPage() {
  const isMobile = useIsMobile();
  const params = new URLSearchParams(window.location.search);
  const requestId = params.get('pay') || '';
  const settings = getSettings();
  const branding = resolveBranding({ companyName: settings.companyName, footerText: settings.footerText });

  const [request, setRequest] = useState(() => getPaymentRequest(requestId));
  const [email, setEmail] = useState(request?.customerEmail || '');
  const [method, setMethod] = useState('card');
  const [coupon, setCoupon] = useState({ valid: false, amountOff: 0 });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState<'info' | 'error' | 'success'>('info');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [paidTxHash, setPaidTxHash] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  if (!request) {
    return (
      <div style={{ maxWidth: 520, margin: '60px auto', padding: 32, textAlign: 'center' }}>
        <div style={cardBase}>
          <h2 style={{ color: '#2f7df6' }}>Payment request not found</h2>
          <p style={{ color: '#5f6c7b' }}>This payment link is invalid or has expired.</p>
        </div>
      </div>
    );
  }

  const subtotal = Number(request.amountUsd || 0);
  const discountAmount = useMemo(() => {
    if (!coupon?.valid || !coupon?.code) return 0;
    const r = validateCoupon({ code: coupon.code, subtotal });
    return r.valid ? Number(r.amountOff) : 0;
  }, [coupon, subtotal]);
  const total = Math.max(0, subtotal - discountAmount);
  const orderDescription = request.description || 'Payment request';
  const requestLocked = request.status === 'paid' || request.status === 'pending';
  const noticeColor = noticeType === 'error' ? '#dc2626' : noticeType === 'success' ? '#166534' : '#5f6c7b';

  const showNotice = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
    setNotice(msg); setNoticeType(type);
  };

  const refreshRequest = () => {
    const r = getPaymentRequest(requestId);
    if (r) setRequest({ ...r });
  };

  const handleFailure = (rawError: string, payMethod: string) => {
    let userMsg = 'Something went wrong. Please try again.';
    const lower = rawError.toLowerCase();
    if (lower.includes('user rejected') || lower.includes('user denied')) userMsg = 'Transaction was cancelled.';
    else if (lower.includes('insufficient')) userMsg = 'Insufficient funds in your wallet.';
    else if (lower.includes('network') || lower.includes('chain')) userMsg = 'Wrong network. Please switch to Base and try again.';
    else if (lower.includes('stripe')) userMsg = 'Card checkout could not be started. Please try again.';
    else if (rawError.length < 100) userMsg = rawError;

    if (request.status === 'pending') resetPaymentRequestToOpen(request.id);
    logEvent('payment_failed', { method: payMethod, error: rawError });
    showNotice(userMsg, 'error');
    refreshRequest();
    setBusy(false);
  };

  const onCardCheckout = async () => {
    const check = canCheckout(request.id);
    if (!check.allowed) { showNotice(check.reason!, 'error'); return; }
    setBusy(true); showNotice('');
    logEvent('payment_attempt', { method: 'card', total, email });
    try {
      markPaymentRequestPending(request.id, { stripePaymentStatus: 'pending' });
      const payload = buildStripeCheckoutPayload({
        request: { ...request, amountUsd: total }, email, couponCode: coupon?.code,
      });
      const session = await createHostedCheckoutSession(payload);
      if (coupon?.valid) incrementCouponUsage(coupon.code);
      await syncCustomerEvent({ type: 'checkout.started', paymentMethod: 'card', email, paymentRequestId: request.id });
      window.location.href = session.url;
    } catch (error) { handleFailure(error.message || 'Stripe checkout failed.', 'card'); }
  };

  const onPayPalCheckout = () => {
    if (!settings.paypalHandle) {
      showNotice('PayPal not configured in admin.', 'error');
      return;
    }
    showNotice(`Send $${total.toFixed(2)} to ${settings.paypalHandle} via PayPal, then share confirmation with the merchant.`, 'info');
  };

  const onVenmoCheckout = () => {
    if (!settings.venmoHandle) {
      showNotice('Venmo not configured in admin.', 'error');
      return;
    }
    showNotice(`Send $${total.toFixed(2)} to ${settings.venmoHandle} via Venmo, then share confirmation with the merchant.`, 'info');
  };

  const onConnectWallet = async () => {
    setBusy(true); showNotice('');
    try {
      const existing = getAccount(wagmiConfig);
      if (existing?.isConnected && existing?.address) {
        setWalletAddress(existing.address); setWalletConnected(true);
        try { await selectNetwork(BASE_CHAIN_ID); } catch {}
        logEvent('wallet_connected', { address: existing.address });
        setBusy(false); return;
      }
      const result = await connectWallet();
      const addr = result?.accounts?.[0] || '';
      setWalletAddress(addr); setWalletConnected(true);
      try { await selectNetwork(BASE_CHAIN_ID); } catch {}
      logEvent('wallet_connected', { address: addr });
    } catch (error) {
      const msg = error.message || '';
      if (msg.toLowerCase().includes('already connected')) {
        const existing = getAccount(wagmiConfig);
        const addr = existing?.address || '';
        setWalletAddress(addr); setWalletConnected(true);
        try { await selectNetwork(BASE_CHAIN_ID); } catch {}
      } else { handleFailure(msg || 'Wallet connection failed.', 'usdc'); }
    } finally { setBusy(false); }
  };

  const onSendUsdc = async () => {
    if (!settings.usdcWallet) {
      showNotice('USDC wallet not configured in admin.', 'error');
      return;
    }
    const check = canCheckout(request.id);
    if (!check.allowed) { showNotice(check.reason!, 'error'); return; }
    setBusy(true); showNotice('');
    logEvent('payment_attempt', { method: 'usdc', total, email });
    try {
      const toAddress = settings.usdcWallet;
      markPaymentRequestPending(request.id);
      const totalRaw = BigInt(Math.round(total * 10 ** USDC_DECIMALS));
      const { merchantAmount, feeAmount, feeRecipient } = splitUsdcPayment(totalRaw);
      const txHash = await sendUsdc({ to: toAddress, amountRaw: merchantAmount });
      logEvent('usdc_sent', { txHash: String(txHash), amount: total });
      if (feeAmount > 0n && feeRecipient) {
        try { await sendUsdc({ to: feeRecipient, amountRaw: feeAmount }); } catch {}
      }
      showNotice('USDC sent! Verifying...', 'info');
      const payload = createUsdcVerificationPayload({
        request, email, walletAddress: toAddress, txHash: String(txHash), amountUsd: total,
      });
      const verifyResult = await verifyUsdcPayment({ ...payload, couponCode: coupon?.code });
      if (verifyResult.verified) {
        markPaymentRequestPaid(request.id, { payment_method: 'usdc', usdcVerification: { txHash: String(txHash), status: 'verified', verifiedAt: new Date().toISOString() } });
        logEvent('payment_success', { method: 'usdc', txHash: String(txHash) });
        setPaidTxHash(String(txHash));
        setShowSuccessModal(true);
        showNotice('', 'success');
        refreshRequest();
      } else {
        handleFailure(verifyResult.reason || 'Transaction not found or invalid.', 'usdc');
      }
    } catch (error) { handleFailure(error.message || 'USDC payment failed.', 'usdc'); }
    finally { setBusy(false); }
  };

  if (request.status === 'paid' && !showSuccessModal) {
    const txHash = request.usdcVerification?.txHash || paidTxHash;
    return (
      <div style={{ maxWidth: 520, margin: '60px auto', padding: '32px 16px' }}>
        <div style={cardBase}>
          <h2 style={{ color: '#166534', margin: '0 0 12px' }}>Payment complete</h2>
          <p style={{ color: '#374151', margin: '0 0 8px' }}>{orderDescription}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 20, padding: '12px 0', borderTop: '1px solid #e5ebf2' }}>
            <span>Amount paid</span><span>${subtotal.toFixed(2)}</span>
          </div>
          {txHash && (
            <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <a
                href={`https://basescan.org/tx/${txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#2f7df6', fontWeight: 600, fontSize: 13, textDecoration: 'underline' }}
              >
                Transaction ID receipt
              </a>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(`https://basescan.org/tx/${txHash}`)}
                style={{ display: 'inline-flex', padding: 0, border: 'none', background: 'transparent', color: '#5f6c7b', cursor: 'pointer' }}
              >
                <CopyIcon size={14} />
              </button>
            </div>
          )}
          {!txHash && <div style={{ marginTop: 12, fontSize: 13, color: '#166534', fontWeight: 600 }}>Paid via Stripe</div>}
          <PoweredByPayMe />
        </div>
      </div>
    );
  }

  return (
    <>
      {showSuccessModal && paidTxHash && (
        <SuccessModal txHash={paidTxHash} total={total} onDismiss={() => { setShowSuccessModal(false); refreshRequest(); }} />
      )}
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: isMobile ? '16px 6px 48px' : '32px 16px 64px', color: '#111827' }}>
        <div style={{ display: 'grid', gap: isMobile ? 16 : 24, gridTemplateColumns: isMobile ? '1fr' : '1.05fr .95fr', alignItems: 'stretch' }}>
          {/* Left card */}
          <div style={{ ...cardBase, ...(isMobile ? { borderRadius: 16, padding: 16 } : {}) }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: 34, color: '#2f7df6' }}>Payment request</h1>
              <p style={{ color: '#5f6c7b' }}>Complete your payment below.</p>

              <label style={{ display: 'block', marginTop: 20, marginBottom: 8, fontWeight: 600 }}>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '14px 16px', border: '1px solid #d5dce5', borderRadius: 14 }} />

              <div style={{ marginTop: 24 }}>
                <div style={{ fontWeight: 700, marginBottom: 12 }}>Request details</div>
                <div style={{ background: '#f7f9fc', borderRadius: 14, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                    <strong>{orderDescription}</strong>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ color: '#5f6c7b', fontSize: 13, marginTop: 8 }}>
                    {request.customerEmail} · {request.status}
                  </div>
                  <div style={{ color: '#5f6c7b', fontSize: 12, marginTop: 4 }}>
                    ID: {request.id}
                  </div>
                </div>
              </div>
            </div>
            <PoweredByPayMe />
          </div>

          {/* Right card — payment */}
          <div style={{ ...cardBase, ...(isMobile ? { borderRadius: 16, padding: 16 } : {}) }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 24, marginBottom: 16, color: '#2f7df6' }}>Summary</div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>{orderDescription}</span><span>${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#166534' }}>
                  <span>Discount</span><span>- ${discountAmount.toFixed(2)}</span>
                </div>
              )}
              {discountAmount === 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#5f6c7b' }}>
                  <span>Discount</span><span>- $0.00</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 20, paddingTop: 10, borderTop: '1px solid #e5ebf2' }}>
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>

              <CouponField subtotal={subtotal} appliedCoupon={coupon} onApply={(result) => setCoupon(result)} />

              <div style={{ marginTop: 24 }}>
                <PaymentMethodsShowcase selected={method} onSelect={setMethod} settings={settings} />
              </div>

              {/* CTA */}
              {method === 'card' || method === 'applepay' || method === 'googlepay' ? (
                <button type="button" disabled={busy || !stripeEnabled() || !!requestLocked} onClick={onCardCheckout}
                  style={{ width: '100%', marginTop: 20, padding: 16, borderRadius: 16, border: 0, background: requestLocked ? '#d1d5db' : '#2f7df6', color: '#fff', fontWeight: 700, fontSize: 15, opacity: (busy || !!requestLocked) ? 0.6 : 1 }}>
                  {!stripeEnabled() ? 'Stripe not configured' : busy ? 'Starting checkout...' : method === 'applepay' ? `Pay $${total.toFixed(2)} with Apple Pay` : method === 'googlepay' ? `Pay $${total.toFixed(2)} with Google Pay` : `Pay $${total.toFixed(2)}`}
                </button>
              ) : method === 'usdc' ? (
                <div style={{ marginTop: 20 }}>
                  {!walletConnected ? (
                    <button type="button" disabled={busy || !!requestLocked} onClick={onConnectWallet}
                      style={{ width: '100%', padding: 16, borderRadius: 16, border: 0, background: requestLocked ? '#d1d5db' : '#2f7df6', color: '#fff', fontWeight: 700, fontSize: 15, opacity: (busy || !!requestLocked) ? 0.6 : 1 }}>
                      {busy ? 'Connecting...' : 'Connect wallet on Base'}
                    </button>
                  ) : (
                    <>
                      <button type="button" disabled={busy || !!requestLocked} onClick={onSendUsdc}
                        style={{ width: '100%', padding: 16, borderRadius: 16, border: 0, background: requestLocked ? '#d1d5db' : '#2f7df6', color: '#fff', fontWeight: 700, fontSize: 15, opacity: (busy || !!requestLocked) ? 0.6 : 1 }}>
                        {busy ? 'Sending USDC...' : `Pay $${total.toFixed(2)} USDC on Base`}
                      </button>
                    </>
                  )}
                </div>
              ) : method === 'paypal' ? (
                <button type="button" disabled={busy || !!requestLocked} onClick={onPayPalCheckout}
                  style={{ width: '100%', marginTop: 20, padding: 16, borderRadius: 16, border: 0, background: requestLocked ? '#d1d5db' : '#2f7df6', color: '#fff', fontWeight: 700, fontSize: 15, opacity: (busy || !!requestLocked) ? 0.6 : 1 }}>
                  {`Pay $${total.toFixed(2)} with PayPal`}
                </button>
              ) : method === 'venmo' ? (
                <button type="button" disabled={busy || !!requestLocked} onClick={onVenmoCheckout}
                  style={{ width: '100%', marginTop: 20, padding: 16, borderRadius: 16, border: 0, background: requestLocked ? '#d1d5db' : '#2f7df6', color: '#fff', fontWeight: 700, fontSize: 15, opacity: (busy || !!requestLocked) ? 0.6 : 1 }}>
                  {`Pay $${total.toFixed(2)} with Venmo`}
                </button>
              ) : null}

              {notice && <div style={{ marginTop: 14, color: noticeColor, fontSize: 14, fontWeight: noticeType === 'error' ? 600 : 400 }}>{notice}</div>}
            </div>
            <PoweredByPayMe />
          </div>
        </div>
      </div>
    </>
  );
}
