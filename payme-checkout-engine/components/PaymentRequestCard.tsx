import React from 'react';

export default function PaymentRequestCard({ request, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect?.(request)}
      style={{
        width: '100%',
        textAlign: 'left',
        border: selected ? '2px solid #2f7df6' : '1px solid #dbe3ee',
        background: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        cursor: 'pointer',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <strong>{request.description || 'Payment request'}</strong>
        <span>${Number(request.amountUsd || 0).toFixed(2)}</span>
      </div>
      <div style={{ color: '#5f6c7b', fontSize: 13, marginTop: 8 }}>
        {request.customerEmail} · {request.status}
      </div>
      <div style={{ color: '#5f6c7b', fontSize: 12, marginTop: 4 }}>
        ID: {request.id}
      </div>
    </button>
  );
}
