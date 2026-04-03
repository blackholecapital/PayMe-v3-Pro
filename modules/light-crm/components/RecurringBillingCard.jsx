import React, { useMemo } from 'react';
import SpineAdminCard from '../../../lib/spine/wrappers/SpineAdminCard.jsx';
import { buildInvoiceHtml, downloadTextFile } from '../lib/invoiceBuilders.js';

export default function RecurringBillingCard({ recurringCustomers, runDate, onRunDateChange, onPrintAll, company, invoiceNumber, amount, items }) {
  const nextRunStr = useMemo(() => {
    const now = new Date();
    const year = now.getMonth() === 11 && runDate <= now.getDate() ? now.getFullYear() + 1 : now.getFullYear();
    const month = runDate <= now.getDate() ? (now.getMonth() + 1) % 12 : now.getMonth();
    return new Date(year, month, runDate).toLocaleDateString();
  }, [runDate]);

  const handleGeneratePdf = () => {
    if (!recurringCustomers.length) return;
    const pages = recurringCustomers.map((customer) =>
      buildInvoiceHtml({
        company,
        customer,
        invoiceNumber: invoiceNumber || 'INV-RECURRING',
        amount: amount || '0.00',
        items: items || [],
        generatedLink: '',
        createdAt: Date.now(),
      })
    );
    const combined = pages.join('<div style="page-break-after:always;"></div>');
    const blob = new Blob([`<!DOCTYPE html><html><head><title>Recurring Invoices</title><style>@media print{.page-break{page-break-after:always}}</style></head><body>${combined}</body></html>`], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recurring-invoices.html';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  };

  return (
    <SpineAdminCard
      title="Recurring Billing"
      subtitle="Customers flagged for monthly recurring invoicing."
      actions={(
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onPrintAll} disabled={!recurringCustomers.length}>Print All</button>
          <button type="button" onClick={handleGeneratePdf} disabled={!recurringCustomers.length}>Generate PDF</button>
        </div>
      )}
    >
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#5f6c7b' }}>
            Run date (day of month):
            <select
              value={runDate}
              onChange={(e) => onRunDateChange(Number(e.target.value))}
              style={{ marginLeft: 8, padding: '4px 8px', fontSize: 13 }}
            >
              {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
          <span style={{ fontSize: 12, color: '#5f6c7b' }}>Next run: {nextRunStr}</span>
        </div>

        {recurringCustomers.length === 0 ? (
          <div style={{ color: '#94a3b8', fontSize: 14, padding: '20px 0' }}>
            No customers have recurring billing enabled. Toggle it on in the Customers tab.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {recurringCustomers.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr auto',
                  gap: 12,
                  alignItems: 'center',
                  padding: '10px 14px',
                  border: '1px solid #e6edf5',
                  borderRadius: 14,
                  background: '#f8fbff',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</div>
                  <div style={{ fontSize: 12, color: '#5f6c7b', marginTop: 2 }}>{c.email || 'No email'}</div>
                </div>
                <div style={{ fontSize: 12, color: '#5f6c7b' }}>
                  {[c.city, c.state].filter(Boolean).join(', ') || 'No location'}
                </div>
                <div style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#166534',
                  background: '#dcfce7',
                  padding: '3px 10px',
                  borderRadius: 10,
                }}>
                  Active
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ fontSize: 12, color: '#5f6c7b', borderTop: '1px solid #e6edf5', paddingTop: 10 }}>
          {recurringCustomers.length} customer{recurringCustomers.length !== 1 ? 's' : ''} enrolled in recurring billing.
        </div>
      </div>
    </SpineAdminCard>
  );
}
