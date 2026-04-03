import React, { useMemo } from 'react';
import SpineAdminCard from '../../../lib/spine/wrappers/SpineAdminCard.jsx';
import { normalizeInvoiceItems, formatMoney } from '../lib/invoiceBuilders.js';

export default function InvoicePreviewCard({ company, customer, invoiceNumber, subject, amount, items, generatedLink, onPrint }) {
  const rows = useMemo(() => normalizeInvoiceItems(items), [items]);
  const dateStr = new Date().toLocaleDateString();

  const companyAddr = [
    company?.address,
    [company?.city, company?.state, company?.zip].filter(Boolean).join(' '),
    company?.country,
  ].filter(Boolean).join(', ');

  const customerAddr = [
    customer?.address,
    [customer?.city, customer?.state, customer?.zip].filter(Boolean).join(' '),
    customer?.country,
  ].filter(Boolean).join(', ');

  return (
    <SpineAdminCard
      title="Invoice Preview"
      subtitle="Real-time preview of the invoice being composed."
      actions={
        <button type="button" onClick={onPrint}>Print / PDF</button>
      }
    >
      <div style={{
        border: '1px solid #e6edf5',
        borderRadius: 16,
        padding: 24,
        background: '#fff',
        fontFamily: 'Arial, sans-serif',
        color: '#0f172a',
        minHeight: 400,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            {company?.logoDataUrl ? (
              <img src={company.logoDataUrl} alt="logo" style={{ maxWidth: 110, maxHeight: 70, display: 'block', marginBottom: 12, borderRadius: 6 }} />
            ) : (
              <div style={{
                width: 110,
                height: 50,
                border: '2px dashed #d5dce5',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                color: '#94a3b8',
                marginBottom: 12,
              }}>
                Logo / Branding
              </div>
            )}
            <div style={{ fontSize: 20, fontWeight: 700, color: '#2f7df6' }}>{company?.name || 'Your Company'}</div>
            {companyAddr && <div style={{ marginTop: 6, fontSize: 13, color: '#5f6c7b', lineHeight: 1.5 }}>{companyAddr}</div>}
            {(company?.email || company?.phone) && (
              <div style={{ marginTop: 4, fontSize: 13, color: '#5f6c7b' }}>
                {[company?.email, company?.phone].filter(Boolean).join(' | ')}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'right', minWidth: 180 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: '#0f172a' }}>INVOICE</div>
            <div style={{ marginTop: 8, fontSize: 13, color: '#5f6c7b' }}>
              <b>Invoice #:</b> {invoiceNumber || '—'}
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: '#5f6c7b' }}>
              <b>Date:</b> {dateStr}
            </div>
            <div style={{ marginTop: 4, fontSize: 14, fontWeight: 700 }}>
              Total: {amount || '0.00'} USDC
            </div>
          </div>
        </div>

        {/* Bill To */}
        <div style={{ padding: 14, borderRadius: 12, background: '#f8fbff', border: '1px solid #e6edf5', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: '#5f6c7b', marginBottom: 6 }}>Bill To</div>
          <div style={{ fontWeight: 700 }}>{customer?.name || 'Customer name'}</div>
          {customerAddr && <div style={{ fontSize: 13, color: '#5f6c7b', marginTop: 4 }}>{customerAddr}</div>}
          {customer?.attention && <div style={{ fontSize: 13, color: '#5f6c7b', marginTop: 2 }}>Attn: {customer.attention}</div>}
          {(customer?.email || customer?.phone) && (
            <div style={{ fontSize: 13, color: '#5f6c7b', marginTop: 2 }}>
              {[customer?.email, customer?.phone].filter(Boolean).join(' | ')}
            </div>
          )}
        </div>

        {/* Subject */}
        {subject && (
          <div style={{ fontSize: 13, color: '#5f6c7b', marginBottom: 12 }}>
            <b>Subject:</b> {subject}
          </div>
        )}

        {/* Line Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e6edf5', borderRadius: 12, overflow: 'hidden' }}>
          <thead>
            <tr style={{ background: '#eef5ff' }}>
              <th style={{ padding: '8px 10px', textAlign: 'left', fontSize: 12, fontWeight: 700 }}>Description</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12, fontWeight: 700 }}>Qty</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12, fontWeight: 700 }}>Unit</th>
              <th style={{ padding: '8px 10px', textAlign: 'right', fontSize: 12, fontWeight: 700 }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: '12px 10px', color: '#94a3b8', fontSize: 13 }}>No line items yet.</td>
              </tr>
            ) : rows.map((item, idx) => {
              const qty = Number(item.qty || 0);
              const unit = Number(item.unit || 0);
              const total = qty && unit ? qty * unit : 0;
              return (
                <tr key={idx}>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #e6edf5', fontSize: 13 }}>{item.desc || '—'}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #e6edf5', textAlign: 'right', fontSize: 13 }}>{item.qty || '—'}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #e6edf5', textAlign: 'right', fontSize: 13 }}>{item.unit || '—'}</td>
                  <td style={{ padding: '8px 10px', borderBottom: '1px solid #e6edf5', textAlign: 'right', fontSize: 13, fontWeight: 600 }}>{total ? formatMoney(total) : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Total */}
        <div style={{ textAlign: 'right', marginTop: 14, fontSize: 16, fontWeight: 700 }}>
          Total Due: {amount || '0.00'} USDC
        </div>

        {/* Pay Link */}
        {generatedLink && (
          <div style={{ marginTop: 16, fontSize: 13, color: '#2f7df6', wordBreak: 'break-all' }}>
            <b>Pay link:</b> {generatedLink}
          </div>
        )}
      </div>
    </SpineAdminCard>
  );
}
