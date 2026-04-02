import React from 'react';
import SettingsAdmin from '../../../payme-checkout-engine/admin/settings.tsx';
import PaymentRequestsAdmin from '../../../payme-checkout-engine/admin/payment-requests.tsx';
import CouponsAdmin from '../../../payme-checkout-engine/admin/coupons.tsx';
import SubscriptionsAdmin from '../../../payme-checkout-engine/admin/subscriptions.tsx';
import LightCrmAdmin from '../../../modules/light-crm/components/LightCrmAdmin.jsx';

export const adminModules = [
  { key: 'settings', label: 'Settings', render: () => <SettingsAdmin /> },
  { key: 'requests', label: 'Payment requests', render: () => <PaymentRequestsAdmin /> },
  { key: 'coupons', label: 'Coupons', render: () => <CouponsAdmin /> },
  { key: 'subscriptions', label: 'Subscriptions', render: () => <SubscriptionsAdmin /> },
  { key: 'crm', label: 'Light CRM', render: () => <LightCrmAdmin /> },
];
