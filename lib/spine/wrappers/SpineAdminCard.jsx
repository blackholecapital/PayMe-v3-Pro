import React from 'react';

export default function SpineAdminCard({ title, subtitle, actions, children, style }) {
  return (
    <section
      style={{
        background: '#ffffff',
        border: '1px solid #e6edf5',
        borderRadius: 20,
        padding: 20,
        boxShadow: '0 2px 14px rgba(10,37,64,.04)',
        ...style,
      }}
    >
      {(title || subtitle || actions) ? (
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div>
            {title ? <h3 style={{ margin: 0, color: '#2f7df6', fontSize: 18 }}>{title}</h3> : null}
            {subtitle ? <div style={{ color: '#5f6c7b', fontSize: 13, marginTop: 4 }}>{subtitle}</div> : null}
          </div>
          {actions ? <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}
