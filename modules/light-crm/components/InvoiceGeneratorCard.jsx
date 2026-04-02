import React from 'react';
import SpineAdminCard from '../../../lib/spine/wrappers/SpineAdminCard.jsx';

export default function InvoiceGeneratorCard({
  invoiceNumber,
  subject,
  invoiceItems,
  effectiveAmount,
  generatedLink,
  selectedCustomer,
  setInvoiceNumber,
  setSubject,
  setAmount,
  setInvoiceItems,
  onCreateLink,
  onCopyLink,
  onDownloadText,
  onDownloadHtml,
  mailtoHref,
  statusMessage,
}) {
  return (
    <SpineAdminCard
      title="Invoice generator"
      subtitle="Creates a v3 payment request while preserving the v2 invoice/customer mapping flow."
      actions={(
        <>
          <button type="button" onClick={onCreateLink}>Create payment link</button>
          <button type="button" onClick={onCopyLink} disabled={!generatedLink}>Copy link</button>
        </>
      )}
    >
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
          <label>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#5f6c7b', marginBottom: 6 }}>Invoice #</span>
            <input value={invoiceNumber || ''} onChange={(e) => setInvoiceNumber(e.target.value)} />
          </label>

          <label>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#5f6c7b', marginBottom: 6 }}>Total due (USDC)</span>
            <input value={effectiveAmount || ''} onChange={(e) => setAmount(e.target.value)} placeholder="99.00" />
          </label>
        </div>

        <label>
          <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#5f6c7b', marginBottom: 6 }}>Subject</span>
          <input value={subject || ''} onChange={(e) => setSubject(e.target.value)} placeholder="Invoice for services" />
        </label>

        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#5f6c7b', marginBottom: 8 }}>Line items</div>
          <div style={{ display: 'grid', gap: 10 }}>
            {invoiceItems.map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 2fr) 110px 110px auto', gap: 8, alignItems: 'end' }}>
                <label>
                  <span style={{ display: 'block', fontSize: 12, color: '#5f6c7b', marginBottom: 4 }}>Description</span>
                  <input
                    value={item.desc || ''}
                    onChange={(e) => setInvoiceItems((rows) => rows.map((row, rowIdx) => rowIdx === idx ? { ...row, desc: e.target.value } : row))}
                    placeholder="Work item or service"
                  />
                </label>
                <label>
                  <span style={{ display: 'block', fontSize: 12, color: '#5f6c7b', marginBottom: 4 }}>Qty</span>
                  <input
                    value={item.qty || ''}
                    onChange={(e) => setInvoiceItems((rows) => rows.map((row, rowIdx) => rowIdx === idx ? { ...row, qty: e.target.value } : row))}
                    placeholder="1"
                  />
                </label>
                <label>
                  <span style={{ display: 'block', fontSize: 12, color: '#5f6c7b', marginBottom: 4 }}>Unit</span>
                  <input
                    value={item.unit || ''}
                    onChange={(e) => setInvoiceItems((rows) => rows.map((row, rowIdx) => rowIdx === idx ? { ...row, unit: e.target.value } : row))}
                    placeholder="99"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => setInvoiceItems((rows) => rows.filter((_, rowIdx) => rowIdx !== idx))}
                  disabled={invoiceItems.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 10 }}>
            <button type="button" onClick={() => setInvoiceItems((rows) => [...rows, { desc: '', qty: '', unit: '' }])}>Add line item</button>
          </div>
        </div>

        <div style={{ padding: 14, borderRadius: 16, background: '#f8fbff', border: '1px solid #e6edf5' }}>
          <div style={{ fontSize: 13, color: '#5f6c7b' }}>Customer</div>
          <div style={{ marginTop: 4, fontWeight: 700, color: '#0f172a' }}>
            {selectedCustomer?.name || 'No saved customer selected'}
          </div>
          <div style={{ marginTop: 2, color: '#5f6c7b' }}>
            {selectedCustomer?.email || 'Save or select a customer to keep invoice mapping attached to CRM history.'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" onClick={onDownloadText}>Export TXT</button>
          <button type="button" onClick={onDownloadHtml}>Export HTML</button>
          <a
            href={mailtoHref || '#'}
            onClick={(e) => { if (!mailtoHref) e.preventDefault(); }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid #d5dce5',
              textDecoration: 'none',
              fontWeight: 600,
              color: '#2f7df6',
              background: '#fff',
            }}
          >
            Open email
          </a>
        </div>

        <div style={{ fontSize: 13, color: statusMessage ? '#166534' : '#5f6c7b', minHeight: 18 }}>
          {statusMessage || (generatedLink ? generatedLink : 'Create a link to generate a v3 payment request URL.')}
        </div>
      </div>
    </SpineAdminCard>
  );
}
