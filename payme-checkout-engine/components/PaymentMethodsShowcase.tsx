import React from 'react';

interface Props {
  selected: string;
  onSelect: (method: string) => void;
  settings?: Record<string, any>;
}

/* USDC coin SVG matching the uploaded mark style */
function UsdcLogo({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <circle cx="16" cy="16" r="16" fill="#2775CA" />
      <path d="M10.2 7.1c-2.5 1.8-4.1 4.8-4.1 8.1 0 3.3 1.6 6.3 4.1 8.1" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M21.8 7.1c2.5 1.8 4.1 4.8 4.1 8.1 0 3.3-1.6 6.3-4.1 8.1" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M19.7 18c0-1.8-1.1-2.4-3.2-2.7-1.5-.2-1.8-.6-1.8-1.3 0-.7.6-1.1 1.5-1.1.8 0 1.4.4 1.6 1 .1.1.2.2.3.2h.9c.2 0 .3-.1.3-.3-.2-1-1-1.8-2.1-2V11c0-.2-.1-.3-.3-.3H16c-.2 0-.3.1-.3.3v1.1c-1.4.2-2.3 1.1-2.3 2.3 0 1.7 1 2.3 3.1 2.6 1.3.2 1.8.6 1.8 1.3 0 .8-.7 1.3-1.7 1.3-1.3 0-1.8-.5-1.9-1.1-.1-.1-.2-.2-.3-.2h-.9c-.2 0-.3.1-.3.3.2 1.2 1 2 2.3 2.2V22c0 .2.1.3.3.3h.8c.2 0 .3-.1.3-.3v-1.1c1.5-.2 2.4-1.2 2.4-2.5Z" fill="white" />
    </svg>
  );
}

export default function PaymentMethodsShowcase({ selected, onSelect, settings = {} }: Props) {
  const stripeOn = Boolean(settings.stripeEnabled);
  const usdcOn = Boolean(settings.usdcEnabled);
  const applePayOn = Boolean(settings.applePayEnabled);
  const googlePayOn = Boolean(settings.googlePayEnabled);
  const paypalOn = Boolean(settings.paypalEnabled);
  const venmoOn = Boolean(settings.venmoEnabled);

  const payWithRow = [
    { id: 'applepay', label: 'Apple Pay', active: applePayOn },
    { id: 'paypal', label: 'PayPal', active: paypalOn },
    { id: 'venmo', label: 'Venmo', active: venmoOn },
    { id: 'googlepay', label: 'Google Pay', active: googlePayOn },
    { id: 'more', label: 'More', active: false },
  ];

  const payWithBtnStyle = (id: string, active: boolean) => {
    const isSel = selected === id;
    return {
      flex: '1 1 0',
      minWidth: 70,
      padding: '10px 8px',
      borderRadius: 14,
      border: isSel ? '2px solid #2f7df6' : '1px solid #d5dce5',
      background: active ? '#fff' : '#f7f8fa',
      color: active ? '#111827' : '#9ca3af',
      cursor: active ? 'pointer' : 'default',
      fontWeight: 600 as const,
      fontSize: 13,
      textAlign: 'center' as const,
      opacity: active ? 1 : 0.7,
    };
  };

  const paymentModeBtnStyle = (id: string, active: boolean) => {
    const isSel = selected === id;
    return {
      width: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      padding: '12px 10px',
      borderRadius: 14,
      border: isSel ? '2px solid #2f7df6' : '1px solid #d5dce5',
      background: active ? '#fff' : '#f7f8fa',
      color: active ? '#111827' : '#9ca3af',
      cursor: active ? 'pointer' : 'default',
      fontWeight: 700 as const,
      fontSize: 14,
      opacity: active ? 1 : 0.75,
    };
  };

  return (
    <div>
      <div style={{ fontWeight: 700, marginBottom: 10 }}>Pay with</div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {payWithRow.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => m.active && onSelect(m.id)}
            style={payWithBtnStyle(m.id, m.active)}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button
          type="button"
          onClick={() => stripeOn && onSelect('card')}
          style={paymentModeBtnStyle('card', stripeOn)}
        >
          <span style={{ fontSize: 21 }} aria-hidden="true">💳</span>
          <span>Card</span>
        </button>

        <button
          type="button"
          onClick={() => usdcOn && onSelect('usdc')}
          style={paymentModeBtnStyle('usdc', usdcOn)}
        >
          <UsdcLogo size={26} />
          <span style={{ fontWeight: 700, fontSize: 14 }}>USDC</span>
        </button>
      </div>
    </div>
  );
}
