import { validateCoupon } from '../../../lib/coupons';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const result = validateCoupon(req.body || {});
  return res.status(result.valid ? 200 : 400).json(result);
}