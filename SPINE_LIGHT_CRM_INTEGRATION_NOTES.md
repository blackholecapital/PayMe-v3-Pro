# PayMe V3 + V2 Light CRM spine integration

This pack keeps V3 as the host and extracts the V2 light CRM into `modules/light-crm`.

## Host files touched
- `src/App.jsx`

## New spine files
- `lib/spine/contracts/light-crm.js`
- `lib/spine/adapters/lightCrmStorageAdapter.js`
- `lib/spine/adapters/lightCrmHistoryAdapter.js`
- `lib/spine/adapters/mobile/lightCrmMobileAdapter.js`
- `lib/spine/registry/adminModules.js`
- `lib/spine/wrappers/SpineAdminCard.jsx`
- `lib/spine/wrappers/SpineAdminSection.jsx`
- `lib/spine/mappers/lightCrmMappers.js`

## New module files
- `modules/light-crm/**`

## Notes
- The CRM uses the existing host `src/services/adminStore.js` storage functions instead of replacing host business logic.
- Invoice generation creates a V3 payment request through `payme-checkout-engine/lib/paymentRequests.ts`.
- Invoice-to-customer mapping still uses the V2-compatible keys already present in the host store.
- No host provider/bootstrap files were imported from V2.
- No V2 global CSS was imported.
