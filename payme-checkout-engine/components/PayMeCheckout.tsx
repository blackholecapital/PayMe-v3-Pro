import React, { useMemo, useState } from 'react';
import { useIsMobile } from '../lib/useIsMobile';
import CouponField from './CouponField';
import PoweredByPayMe from './PoweredByPayMe';
import PaymentMethodsShowcase from './PaymentMethodsShowcase';
import { resolveBranding } from '../config/branding';
import { getSettings } from '../lib/storage';
import {
  listPaymentRequests,
  markPaymentRequestPaid,
  markPaymentRequestPending,
  resetPaymentRequestToOpen,
  canCheckout,
} from '../lib/paymentRequests';
import {
  buildStripeCheckoutPayload,
  buildSubscriptionCheckoutPayload,
  createHostedCheckoutSession,
  stripeEnabled,
} from '../lib/stripe';
import { createUsdcVerificationPayload, verifyUsdcPayment } from '../lib/usdc';
import { incrementCouponUsage, validateCoupon } from '../lib/coupons';
import { syncCustomerEvent } from '../lib/crm';
import { logEvent } from '../lib/eventLog';
import { splitUsdcPayment } from '../lib/usdcFees';
import PaymentRequestCard from './PaymentRequestCard';
import { connectWallet, selectNetwork, sendUsdc, wagmiConfig } from '../../src/services/usdcTransfer.js';
import { getAccount } from 'wagmi/actions';
import { BASE_CHAIN_ID, USDC_DECIMALS } from '../../src/config/constants.js';

function getRequestFromUrl(requests) {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('request');
  return requests.find((item) => item.id === id) || requests[0];
}

interface BasketOrder {
  subtotal: number;
  discount: number;
  total: number;
  description: string;
  hasSubscription?: boolean;
  subscriptionItems?: any[];
  onetimeItems?: any[];
}

interface Props {
  basketOrder?: BasketOrder | null;
}

function FailureCard({ message, onDismiss }: { message: string; onDismiss: () => void }) {
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
          background: '#fff', borderRadius: 20, padding: '36px 32px', maxWidth: 400, width: '90%',
          boxShadow: '0 24px 60px rgba(0,0,0,.18)', textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 12 }}>!</div>
        <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>Payment failed</h2>
        <p style={{ color: '#5f6c7b', fontSize: 14, margin: '0 0 24px', lineHeight: 1.5 }}>{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: '#2f7df6', color: '#fff', border: 0, borderRadius: 14,
            padding: '14px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    </div>
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

export default function PayMeCheckout({ basketOrder }: Props) {
  const isMobile = useIsMobile();
  const settings = getSettings();
  const branding = resolveBranding({ companyName: settings.companyName, footerText: settings.footerText });

  const requests = (() => {
    const all = listPaymentRequests();
    let changed = false;
    for (const r of all) {
      if (r.status === 'pending') { resetPaymentRequestToOpen(r.id); changed = true; }
    }
    return changed ? listPaymentRequests() : all;
  })();

  const [selected, setSelected] = useState(() => getRequestFromUrl(requests));
  const [email, setEmail] = useState(selected?.customerEmail || '');
  const [method, setMethod] = useState('card');
  const [coupon, setCoupon] = useState({ valid: false, amountOff: 0 });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [noticeType, setNoticeType] = useState<'info' | 'error' | 'success'>('info');
  const [walletConnected, setWalletConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [failureMsg, setFailureMsg] = useState('');

  const hasBasketOrder = !!basketOrder;
  const hasSubscription = hasBasketOrder && basketOrder.hasSubscription;

  const subtotal = hasBasketOrder
    ? basketOrder.subtotal
    : Number(selected?.amountUsd || settings.unitAmountUsd || 0);

  const discountAmount = useMemo(() => {
    if (hasBasketOrder) return basketOrder.discount;
    if (!coupon?.valid || !coupon?.code) return 0;
    const revalidated = validateCoupon({ code: coupon.code, subtotal });
    return revalidated.valid ? Number(revalidated.amountOff) : 0;
  }, [hasBasketOrder, basketOrder, coupon, subtotal]);

  const total = useMemo(
    () => (hasBasketOrder ? basketOrder.total : Math.max(0, subtotal - discountAmount)),
    [hasBasketOrder, basketOrder, subtotal, discountAmount],
  );
  const orderDescription = hasBasketOrder ? basketOrder.description : (selected?.description || 'Payment request');

  const showNotice = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
    setNotice(msg); setNoticeType(type);
  };

  const handleFailure = (rawError: string, method: string) => {
    let userMsg = 'Something went wrong. Please try again.';
    const lower = rawError.toLowerCase();
    if (lower.includes('user rejected') || lower.includes('user denied')) userMsg = 'Transaction was cancelled.';
    else if (lower.includes('insufficient')) userMsg = 'Insufficient funds in your wallet.';
    else if (lower.includes('network') || lower.includes('chain')) userMsg = 'Wrong network. Please switch to Base and try again.';
    else if (lower.includes('stripe')) userMsg = 'Card checkout could not be started. Please try again.';
    else if (rawError.length < 100) userMsg = rawError;

    if (!hasBasketOrder && selected && selected.status === 'pending') {
      resetPaymentRequestToOpen(selected.id);
      const refreshed = listPaymentRequests().find((r) => r.id === selected.id);
      if (refreshed) setSelected(refreshed);
    }
    logEvent('payment_failed', { method, error: rawError });
    setFailureMsg(userMsg);
    setBusy(false);
  };

  const dismissFailure = () => {
    setFailureMsg(''); setNotice('');
    const refreshed = listPaymentRequests();
    const current = refreshed.find((r) => r.id === selected?.id) || refreshed[0];
    if (current) setSelected(current);
  };

  const onCardCheckout = async () => {
    if (!hasBasketOrder && selected) {
      const check = canCheckout(selected.id);
      if (!check.allowed) { handleFailure(check.reason!, 'card'); return; }
    }
    setBusy(true); showNotice('');
    logEvent('payment_attempt', { method: 'card', total, email });
    try {
      if (!hasBasketOrder && selected) markPaymentRequestPending(selected.id, { stripePaymentStatus: 'pending' });
      if (hasSubscription && basketOrder?.subscriptionItems?.length) {
        const subPayload = buildSubscriptionCheckoutPayload({ subscriptionItems: basketOrder.subscriptionItems, email, couponCode: coupon?.code });
        const session = await createHostedCheckoutSession(subPayload);
        if (coupon?.valid) incrementCouponUsage(coupon.code);
        window.location.href = session.url; return;
      }
      const payload = buildStripeCheckoutPayload({
        request: hasBasketOrder ? { id: 'basket-order', description: orderDescription, amountUsd: total } : { ...selected, amountUsd: total },
        email, couponCode: coupon?.code,
      });
      const session = await createHostedCheckoutSession(payload);
      if (coupon?.valid) { incrementCouponUsage(coupon.code); logEvent('coupon_applied', { code: coupon.code, discount: discountAmount }); }
      await syncCustomerEvent({ type: 'checkout.started', paymentMethod: 'card', email, paymentRequestId: selected?.id || 'basket' });
      window.location.href = session.url;
    } catch (error) { handleFailure(error.message || 'Stripe checkout failed.', 'card'); }
  };

  const onConnectWallet = async () => {
    setBusy(true); showNotice('');
    try {
      const existing = getAccount(wagmiConfig);
      if (existing?.isConnected && existing?.address) {
        setWalletAddress(existing.address); setWalletConnected(true);
        try { await selectNetwork(BASE_CHAIN_ID); } catch {}
        logEvent('wallet_connected', { address: existing.address });
        showNotice(`Connected: ${existing.address.slice(0, 6)}...${existing.address.slice(-4)}`, 'success');
        setBusy(false); return;
      }
      const result = await connectWallet();
      const addr = result?.accounts?.[0] || '';
      setWalletAddress(addr); setWalletConnected(true);
      try { await selectNetwork(BASE_CHAIN_ID); } catch {}
      logEvent('wallet_connected', { address: addr });
      showNotice(addr ? `Connected: ${addr.slice(0, 6)}...${addr.slice(-4)}` : 'Wallet connected.', 'success');
    } catch (error) {
      const msg = error.message || '';
      if (msg.toLowerCase().includes('already connected')) {
        const existing = getAccount(wagmiConfig);
        const addr = existing?.address || '';
        setWalletAddress(addr); setWalletConnected(true);
        try { await selectNetwork(BASE_CHAIN_ID); } catch {}
        showNotice(addr ? `Connected: ${addr.slice(0, 6)}...${addr.slice(-4)}` : 'Wallet connected.', 'success');
      } else { handleFailure(msg || 'Wallet connection failed.', 'usdc'); }
    } finally { setBusy(false); }
  };

  const onSendUsdc = async () => {
    if (!hasBasketOrder && selected) {
      const check = canCheckout(selected.id);
      if (!check.allowed) { handleFailure(check.reason!, 'usdc'); return; }
    }
    setBusy(true); showNotice('');
    logEvent('payment_attempt', { method: 'usdc', total, email });
    try {
      const toAddress = settings.usdcWallet;
      if (!toAddress) throw new Error('USDC wallet not configured in admin.');
      if (!hasBasketOrder && selected) markPaymentRequestPending(selected.id);

      const totalRaw = BigInt(Math.round(total * 10 ** USDC_DECIMALS));
      const { merchantAmount, feeAmount, feeRecipient } = splitUsdcPayment(totalRaw);

      // Send merchant payment
      const txHash = await sendUsdc({ to: toAddress, amountRaw: merchantAmount });
      logEvent('usdc_sent', { txHash: String(txHash), amount: total, feeAmount: feeAmount.toString() });

      // Send fee if configured
      if (feeAmount > 0n && feeRecipient) {
        try {
          await sendUsdc({ to: feeRecipient, amountRaw: feeAmount });
          logEvent('usdc_sent', { type: 'fee', to: feeRecipient, amount: feeAmount.toString() });
        } catch (feeErr) {
          console.error('[payme:fee] Fee transfer failed:', feeErr.message);
        }
      }

      showNotice('USDC sent! Verifying...', 'info');
      const payload = createUsdcVerificationPayload({
        request: selected || { id: 'basket-order' }, email,
        walletAddress: toAddress, txHash: String(txHash), amountUsd: total,
      });
      const verifyResult = await verifyUsdcPayment({ ...payload, couponCode: coupon?.code });
      if (verifyResult.verified) {
        if (selected) markPaymentRequestPaid(selected.id, { payment_method: 'usdc', usdcVerification: { txHash: String(txHash), status: 'verified', verifiedAt: new Date().toISOString() } });
        logEvent('payment_success', { method: 'usdc', txHash: String(txHash) });
        showNotice(`Payment verified${verifyResult.mocked ? ' (mock mode)' : ''}!`, 'success');
      } else {
        handleFailure(verifyResult.reason || 'Transaction not found or invalid.', 'usdc');
      }
    } catch (error) { handleFailure(error.message || 'USDC payment failed.', 'usdc'); }
    finally { setBusy(false); }
  };

  if (!hasBasketOrder && !selected) return <div style={{ padding: 24 }}>No payment requests available.</div>;

  const requestLocked = !hasBasketOrder && selected && (selected.status === 'paid' || selected.status === 'pending');
  const noticeColor = noticeType === 'error' ? '#dc2626' : noticeType === 'success' ? '#166534' : '#5f6c7b';

  return (
    <>
      {failureMsg && <FailureCard message={failureMsg} onDismiss={dismissFailure} />}

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: isMobile ? '16px 6px 48px' : '32px 16px 64px', color: '#111827' }}>
        <div style={{ display: 'grid', gap: isMobile ? 16 : 24, gridTemplateColumns: isMobile ? '1fr' : '1.05fr .95fr', alignItems: 'stretch' }}>
          {/* Left card */}
          <div style={{ ...cardBase, ...(isMobile ? { borderRadius: 16, padding: 16 } : {}) }}>
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: 34, color: '#2f7df6' }}>
                {hasBasketOrder ? 'Complete your order' : branding.checkoutTitle}
              </h1>
              <p style={{ color: '#5f6c7b' }}>
                {hasBasketOrder ? 'Review your order summary and pay.' : branding.checkoutSubtitle}
              </p>

              <label style={{ display: 'block', marginTop: 20, marginBottom: 8, fontWeight: 600 }}>Email</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: '100%', padding: '14px 16px', border: '1px solid #d5dce5', borderRadius: 14 }} />

              {hasBasketOrder ? (
                <div style={{ marginTop: 24 }}>
                  <div style={{ fontWeight: 700, marginBottom: 12 }}>Order recap</div>
                  <div style={{ background: '#f7f9fc', borderRadius: 14, padding: 16 }}>
                    <div style={{ fontSize: 14, color: '#374151', lineHeight: 1.6 }}>{orderDescription}</div>
                    {hasSubscription && (
                      <div style={{ fontSize: 12, color: '#2f7df6', marginTop: 8 }}>Includes recurring subscription(s) — billed via Stripe.</div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontWeight: 700, marginBottom: 12 }}>Payment requests</div>
                  {requests.map((request) => (
                    <PaymentRequestCard
                      key={request.id} request={request} selected={selected.id === request.id}
                      onSelect={(next) => { setSelected(next); setEmail(next.customerEmail || ''); setCoupon({ valid: false, amountOff: 0 }); setNotice(''); }}
                    />
                  ))}
                </div>
              )}
            </div>
            <PoweredByPayMe />
          </div>

          {/* Right card — payment */}
          <div style={{ ...cardBase, ...(isMobile ? { borderRadius: 16, padding: 16 } : {}) }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 24, marginBottom: 16, color: '#2f7df6' }}>
                {hasBasketOrder ? 'Payment' : 'Summary'}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span>{hasBasketOrder ? 'Order subtotal' : orderDescription}</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#166534' }}>
                  <span>Discount</span><span>- ${discountAmount.toFixed(2)}</span>
                </div>
              )}
              {!hasBasketOrder && discountAmount === 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#5f6c7b' }}>
                  <span>Discount</span><span>- $0.00</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 20, paddingTop: 10, borderTop: '1px solid #e5ebf2' }}>
                <span>Total</span><span>${total.toFixed(2)}</span>
              </div>

              {!hasBasketOrder && (
                <CouponField subtotal={subtotal} appliedCoupon={coupon} onApply={(result) => { setCoupon(result); }} />
              )}

              {requestLocked && (
                <div style={{ marginTop: 16, padding: 12, borderRadius: 12, background: '#fef2f2', color: '#dc2626', fontSize: 14, fontWeight: 600 }}>
                  {selected.status === 'paid' ? 'This request has already been paid.' : 'A payment is already in progress.'}
                </div>
              )}

              <div style={{ marginTop: 24 }}>
                <PaymentMethodsShowcase selected={method} onSelect={setMethod} settings={settings} />
              </div>

              {/* CTA */}
              {method === 'card' || method === 'applepay' || method === 'googlepay' ? (
                <button type="button" disabled={busy || !stripeEnabled() || !!requestLocked} onClick={onCardCheckout}
                  style={{ width: '100%', marginTop: 20, padding: 16, borderRadius: 16, border: 0, background: requestLocked ? '#d1d5db' : '#2f7df6', color: '#fff', fontWeight: 700, fontSize: 15, opacity: (busy || !!requestLocked) ? 0.6 : 1 }}>
                  {!stripeEnabled() ? 'Stripe not configured' : busy ? 'Starting checkout...' : hasSubscription ? `Subscribe — $${total.toFixed(2)}` : method === 'applepay' ? `Pay $${total.toFixed(2)} with Apple Pay` : method === 'googlepay' ? `Pay $${total.toFixed(2)} with Google Pay` : `Pay $${total.toFixed(2)}`}
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
                <button type="button" disabled={busy || !!requestLocked}
                  onClick={() => { if (!settings.paypalHandle) { showNotice('PayPal not configured in admin.', 'error'); return; } showNotice(`Send $${total.toFixed(2)} to ${settings.paypalHandle} via PayPal, then share confirmation with the merchant.`, 'info'); }}
                  style={{ width: '100%', marginTop: 20, padding: 16, borderRadius: 16, border: 0, background: requestLocked ? '#d1d5db' : '#2f7df6', color: '#fff', fontWeight: 700, fontSize: 15, opacity: (busy || !!requestLocked) ? 0.6 : 1 }}>
                  {`Pay $${total.toFixed(2)} with PayPal`}
                </button>
              ) : method === 'venmo' ? (
                <button type="button" disabled={busy || !!requestLocked}
                  onClick={() => { if (!settings.venmoHandle) { showNotice('Venmo not configured in admin.', 'error'); return; } showNotice(`Send $${total.toFixed(2)} to ${settings.venmoHandle} via Venmo, then share confirmation with the merchant.`, 'info'); }}
                  style={{ width: '100%', marginTop: 20, padding: 16, borderRadius: 16, border: 0, background: requestLocked ? '#d1d5db' : '#2f7df6', color: '#fff', fontWeight: 700, fontSize: 15, opacity: (busy || !!requestLocked) ? 0.6 : 1 }}>
                  {`Pay $${total.toFixed(2)} with Venmo`}
                </button>
              ) : null}

              {notice && !failureMsg ? <div style={{ marginTop: 14, color: noticeColor, fontSize: 14, fontWeight: noticeType === 'error' ? 600 : 400 }}>{notice}</div> : null}
            </div>
            <PoweredByPayMe />
          </div>
        </div>
      </div>
    </>
  );
}
