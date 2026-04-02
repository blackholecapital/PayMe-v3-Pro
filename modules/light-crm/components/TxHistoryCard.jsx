import React from 'react';
import SpineAdminCard from '../../../lib/spine/wrappers/SpineAdminCard.jsx';
import { shortAddr } from '../../../src/utils/format.js';
import { buildTxUrl } from '../lib/invoiceBuilders.js';

export default function TxHistoryCard({ timeline, onRefresh }) {
  return (
    <SpineAdminCard
      title="CRM-linked timeline"
      subtitle="Combines v3 local history and inbound ping data through a spine history adapter."
      actions={<button type="button" onClick={onRefresh}>Refresh</button>}
    >
      <div style={{ display: 'grid', gap: 8 }}>
        {timeline.length === 0 ? (
          <div style={{ color: '#5f6c7b', fontSize: 14 }}>No local history yet.</div>
        ) : timeline.map((row, index) => {
          const txUrl = buildTxUrl(row.txHash, row.chainId);
          return (
            <div
              key={`${row.source}_${row.invoiceRef || row.txHash || index}`}
              style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr auto',
                gap: 12,
                alignItems: 'center',
                padding: '10px 12px',
                border: '1px solid #e6edf5',
                borderRadius: 14,
              }}
            >
              <div>
                <div style={{ fontSize: 12, color: '#5f6c7b', textTransform: 'uppercase', letterSpacing: '.04em' }}>{row.source}</div>
                <div style={{ marginTop: 4, fontWeight: 700 }}>{row.invoiceRef || '—'}</div>
              </div>

              <div>
                <div style={{ fontWeight: 600 }}>{row.customerName || row.customerEmail || 'Payment event'}</div>
                <div style={{ color: '#5f6c7b', fontSize: 13, marginTop: 2 }}>
                  {row.amountDisplay ? `${row.amountDisplay} USDC` : 'Amount unavailable'} · {row.status || 'event'}
                </div>
                <div style={{ color: '#5f6c7b', fontSize: 12, marginTop: 2 }}>
                  {new Date(row.ts || Date.now()).toLocaleString()}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                {txUrl ? (
                  <a href={txUrl} target="_blank" rel="noreferrer" style={{ color: '#2f7df6', fontWeight: 600, textDecoration: 'none' }}>
                    {shortAddr(row.txHash)}
                  </a>
                ) : (
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>{shortAddr(row.txHash) || '—'}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </SpineAdminCard>
  );
}
