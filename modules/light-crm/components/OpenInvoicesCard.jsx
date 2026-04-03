import React from 'react';
import SpineAdminCard from '../../../lib/spine/wrappers/SpineAdminCard.jsx';

export default function OpenInvoicesCard({ openInvoices }) {
  return (
    <SpineAdminCard
      title="Open Invoices"
      subtitle="Payment requests that haven't been marked as paid."
    >
      <div style={{ display: 'grid', gap: 8 }}>
        {openInvoices.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: 14, padding: '20px 0' }}>
            No open invoices. All payment requests are either paid or have no outstanding balance.
          </div>
        ) : openInvoices.map((inv) => (
          <div
            key={inv.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr auto',
              gap: 12,
              alignItems: 'center',
              padding: '10px 14px',
              border: '1px solid #e6edf5',
              borderRadius: 14,
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{inv.customerName || inv.customerEmail || 'Unknown'}</div>
              <div style={{ fontSize: 12, color: '#5f6c7b', marginTop: 2 }}>{inv.description || 'No description'}</div>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{inv.amountUsd || 0} USDC</div>
              <div style={{ fontSize: 12, color: '#5f6c7b', marginTop: 2 }}>
                {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : '—'}
              </div>
            </div>
            <div style={{
              fontSize: 11,
              fontWeight: 700,
              color: inv.status === 'pending' ? '#92400e' : '#1e40af',
              background: inv.status === 'pending' ? '#fef3c7' : '#dbeafe',
              padding: '3px 10px',
              borderRadius: 10,
              textTransform: 'capitalize',
            }}>
              {inv.status}
            </div>
          </div>
        ))}

        <div style={{ fontSize: 12, color: '#5f6c7b', borderTop: '1px solid #e6edf5', paddingTop: 10 }}>
          {openInvoices.length} open invoice{openInvoices.length !== 1 ? 's' : ''}.
        </div>
      </div>
    </SpineAdminCard>
  );
}
