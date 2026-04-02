# PayMe Checkout Engine

Portable checkout engine layered into the provided skeleton.

## Modes
- Customer checkout: `/`
- Admin: `/?admin=1`

## Included
- Stripe hosted checkout launch seam
- Base USDC verification seam
- Payment-request admin
- Coupon validation and CRUD-lite
- CRM webhook seam
- Config-driven branding/footer

## Env
- `VITE_RECEIVING_ADDRESS`
- `VITE_WC_PROJECT_ID`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

## Notes
The Vite app works in local mock mode for Stripe session creation and USDC verification when server routes are not mounted. The `payme-checkout-engine/pages/api/*` files are ready to be mounted in a Next/Vercel style runtime for live hosted checkout and webhook truth.