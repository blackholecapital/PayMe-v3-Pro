# PayMe Checkout Engine

Additive module layered onto the existing payments repo.
Purpose: portable checkout, admin payment requests, coupon touchpoints, and future SaaS integration seams.
Reused base assets to adapt next: `src/services/usdcTransfer.js`, `src/services/adminStore.js`, `src/components/PaymentCard.jsx`, `src/pages/AdminPanel.jsx`, `src/config/constants.js`.
Next engineer: wire real UI/routes/data flow; keep config-driven boundaries and adapter isolation intact.
