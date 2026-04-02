import { getSettings } from './storage';

export function buildStripeCheckoutPayload({ request, email, couponCode, successUrl, cancelUrl }) {
  const settings = getSettings();
  return {
    mode: settings.stripeMode || 'payment',
    payment_method_types: ['card'],
    line_items: settings.stripePriceId
      ? [{ price: settings.stripePriceId, quantity: 1 }]
      : [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: request.description || settings.productName,
              description: settings.productDescription,
            },
            unit_amount: Math.round(Number(request.amountUsd || settings.unitAmountUsd) * 100),
          },
          quantity: 1,
        }],
    customer_email: email || request.customerEmail,
    success_url: successUrl || `${window.location.origin}/?success=1&request=${request.id}`,
    cancel_url: cancelUrl || `${window.location.origin}/?request=${request.id}`,
    metadata: {
      paymentRequestId: request.id,
      couponCode: couponCode || request.couponCode || '',
      source: 'payme-checkout-engine',
    },
  };
}

/**
 * Build a Stripe checkout payload for a subscription (recurring) item.
 * Uses `mode: 'subscription'` and the Stripe recurring price ID.
 */
export function buildSubscriptionCheckoutPayload({ subscriptionItems, email, couponCode, successUrl, cancelUrl }) {
  const line_items = subscriptionItems.map((si) => {
    if (si.subscription?.stripePriceId) {
      return { price: si.subscription.stripePriceId, quantity: si.qty || 1 };
    }
    // Fallback: inline price_data with recurring
    const intervalMap = { monthly: 'month', '6_months': 'month', annually: 'year' };
    const intervalCountMap = { monthly: 1, '6_months': 6, annually: 1 };
    return {
      price_data: {
        currency: 'usd',
        product_data: { name: si.name, description: si.description || '' },
        unit_amount: Math.round(si.unitPrice * 100),
        recurring: {
          interval: intervalMap[si.subscription?.interval] || 'month',
          interval_count: intervalCountMap[si.subscription?.interval] || 1,
        },
      },
      quantity: si.qty || 1,
    };
  });

  return {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items,
    customer_email: email,
    success_url: successUrl || `${window.location.origin}/?success=1&subscription=1`,
    cancel_url: cancelUrl || `${window.location.origin}/?basket=1`,
    metadata: {
      couponCode: couponCode || '',
      source: 'payme-checkout-engine',
      type: 'subscription',
    },
  };
}

export async function createHostedCheckoutSession(payload) {
  const res = await fetch('/api/stripe/create-checkout-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => null);

  if (res?.ok) return res.json();

  const mockId = `cs_test_${Math.random().toString(36).slice(2, 10)}`;
  return {
    id: mockId,
    url: `${window.location.origin}/?success=1&request=${payload.metadata?.paymentRequestId || 'mock'}&mock_stripe=1`,
    mocked: true,
  };
}

export function stripeEnabled() {
  return Boolean(getSettings().stripeEnabled);
}
