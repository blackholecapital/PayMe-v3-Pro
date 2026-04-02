import React from 'react';

export default function SpineAdminSection({ title, children, style }) {
  return (
    <div style={{ marginTop: 16, ...style }}>
      {title ? <div style={{ fontSize: 12, fontWeight: 700, color: '#5f6c7b', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>{title}</div> : null}
      {children}
    </div>
  );
}
