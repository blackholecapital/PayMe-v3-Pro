import React, { useState, useEffect } from 'react';

function useIsMobile(bp = 768) {
  const [m, setM] = useState(typeof window !== 'undefined' ? window.innerWidth < bp : false);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${bp - 1}px)`);
    const cb = (e) => setM(e.matches);
    mql.addEventListener('change', cb);
    setM(mql.matches);
    return () => mql.removeEventListener('change', cb);
  }, [bp]);
  return m;
}

function currentTab() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('admin') === '1') return 'admin';
  if (params.get('basket') === '1') return 'basket';
  return 'checkout';
}

const NAV_ITEMS = [
  { key: 'checkout', label: 'Payment request', href: '/' },
  { key: 'basket', label: 'Basket demo', href: '/?basket=1' },
  { key: 'admin', label: 'Admin', href: '/?admin=1' },
];

export default function Navbar({ mode } = {}) {
  const active = currentTab();

  if (mode === 'pay') {
    return (
      <header style={{ background: '#ffffffdd', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e5ebf2' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '18px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <a
            href="/"
            style={{
              position: 'absolute', left: 16, display: 'flex', alignItems: 'center', gap: 6,
              color: '#2f7df6', textDecoration: 'none', fontWeight: 600, fontSize: 14,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2f7df6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </a>
          <div style={{ fontWeight: 800, letterSpacing: '.04em', color: '#2f7df6', textAlign: 'center' }}>
            PayMe-Pro <span style={{ fontWeight: 600, color: '#2f7df6' }}>Payment Request</span>
          </div>
        </div>
      </header>
    );
  }

  const isMobile = useIsMobile();

  return (
    <header style={{ background: '#ffffffdd', backdropFilter: 'blur(12px)', borderBottom: '1px solid #e5ebf2' }}>
      <div style={{ maxWidth: 1080, margin: '0 auto', padding: isMobile ? '12px 10px' : '18px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontWeight: 800, letterSpacing: '.04em', color: '#2f7df6', fontSize: isMobile ? 15 : undefined, flexShrink: 0 }}>PayMe-Pro</div>
        <nav style={{ display: 'flex', gap: isMobile ? 4 : 6, flexShrink: 1, minWidth: 0 }}>
          {NAV_ITEMS.map((item) => (
            <a
              key={item.key}
              href={item.href}
              style={{
                padding: isMobile ? '5px 8px' : '6px 14px',
                borderRadius: 10,
                color: active === item.key ? '#fff' : '#2f7df6',
                background: active === item.key ? '#2f7df6' : 'transparent',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: isMobile ? 12 : 14,
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
