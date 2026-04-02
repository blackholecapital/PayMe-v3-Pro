import React, { useMemo, useState, useCallback } from 'react';
import Navbar from './components/Navbar';
import PayMeCheckout from '../payme-checkout-engine/components/PayMeCheckout.tsx';
import BasketDemo from '../payme-checkout-engine/components/BasketDemo.tsx';
import SinglePaymentPage from '../payme-checkout-engine/components/SinglePaymentPage.tsx';
import { adminModules } from '../lib/spine/registry/adminModules.jsx';

function currentScreen() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('admin') === '1') return 'admin';
  if (params.get('basket') === '1') return 'basket';
  if (params.get('pay')) return 'pay';
  return 'checkout';
}

export default function App() {
  const [screen, setScreen] = useState(currentScreen());
  const [tab, setTab] = useState('settings');

  const [basketOrder, setBasketOrder] = useState(null);

  const handleProceedToCheckout = useCallback((order) => {
    setBasketOrder(order);
    setScreen('checkout');
  }, []);

  const adminView = useMemo(() => {
    const hit = adminModules.find((item) => item.key === tab) || adminModules[0];
    return hit.render();
  }, [tab]);

  return (
    <>
      <Navbar mode={screen === 'pay' ? 'pay' : undefined} />
      {screen === 'admin' ? (
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 16px 64px', color: '#111827' }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {adminModules.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                style={{
                  background: tab === item.key ? '#2f7df6' : '#fff',
                  color: tab === item.key ? '#fff' : '#2f7df6',
                  border: tab === item.key ? 'none' : '1px solid #d5dce5',
                  fontWeight: 600,
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <div style={{ background: '#fff', borderRadius: 24, padding: 24, boxShadow: '0 4px 24px rgba(47,125,246,.10), 0 16px 40px rgba(10,37,64,.06)' }}>
            {adminView}
          </div>
        </div>
      ) : screen === 'pay' ? (
        <SinglePaymentPage />
      ) : screen === 'basket' ? (
        <BasketDemo onProceedToCheckout={handleProceedToCheckout} />
      ) : (
        <PayMeCheckout basketOrder={basketOrder} />
      )}
    </>
  );
}
