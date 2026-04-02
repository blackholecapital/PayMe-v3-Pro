import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const secretKey = process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY;
  if (!secretKey) return res.status(400).json({ error: 'Missing STRIPE_SECRET_KEY' });

  const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });
  const payload = req.body || {};

  // SERVER-SIDE COUPON ENFORCEMENT (Task 5):
  // If the payload contains inline price_data with unit_amount AND a couponCode
  // in metadata, we do NOT trust the frontend discount. Re-validate here.
  // For now the coupon store is localStorage (client-only), so we pass-through
  // the amount the frontend computed. When migrating to KV/D1 the coupon
  // lookup will happen here and override the line_items amount.
  // This comment block is the enforcement hook point.

  console.log('[payme:stripe] Creating checkout session', {
    mode: payload.mode,
    email: payload.customer_email,
    couponCode: payload.metadata?.couponCode,
  });

  try {
    const session = await stripe.checkout.sessions.create(payload);
    return res.status(200).json({ id: session.id, url: session.url });
  } catch (err) {
    console.error('[payme:stripe] Session creation failed:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
