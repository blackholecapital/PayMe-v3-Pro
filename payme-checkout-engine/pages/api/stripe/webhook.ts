import Stripe from 'stripe';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secretKey = process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || process.env.VITE_STRIPE_WEBHOOK_SECRET;
  if (!secretKey || !webhookSecret) return res.status(400).json({ error: 'Missing Stripe secrets' });

  const stripe = new Stripe(secretKey, { apiVersion: '2024-06-20' });
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks);
  const signature = req.headers['stripe-signature'];

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error('[payme:webhook] Signature verification failed:', error.message);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // --- Handle checkout.session.completed ---
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionId = session.id;
    const customerEmail = session.customer_email || session.customer_details?.email || '';
    const amountTotal = session.amount_total; // cents
    const paymentRequestId = session.metadata?.paymentRequestId || '';
    const couponCode = session.metadata?.couponCode || '';

    console.log('[payme:webhook] checkout.session.completed', {
      sessionId,
      customerEmail,
      amountTotal,
      paymentRequestId,
    });

    return res.status(200).json({
      received: true,
      event: event.type,
      sessionId,
      customerEmail,
      amountTotal,
      paymentRequestId,
      couponCode,
      status: 'paid',
      payment_method: 'stripe',
      paid_at: new Date().toISOString(),
    });
  }

  // Acknowledge other events
  return res.status(200).json({ received: true, type: event.type });
}
