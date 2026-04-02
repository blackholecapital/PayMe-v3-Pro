import { listCoupons, upsertCoupon } from '../../../lib/coupons';

export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json({ coupons: listCoupons() });
  if (req.method === 'POST') return res.status(200).json({ coupon: upsertCoupon(req.body || {}) });
  return res.status(405).json({ error: 'Method not allowed' });
}