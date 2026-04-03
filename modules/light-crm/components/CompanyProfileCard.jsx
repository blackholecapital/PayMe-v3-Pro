import React, { useCallback, useRef, useState } from 'react';
import SpineAdminCard from '../../../lib/spine/wrappers/SpineAdminCard.jsx';

function Input({ label, value, onChange, placeholder }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#5f6c7b', marginBottom: 6 }}>{label}</span>
      <input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%' }}
      />
    </label>
  );
}

export default function CompanyProfileCard({ company, onPatch, onSave, savedMessage, collapsed, onToggleCollapse }) {
  const fileRef = useRef(null);

  const handleLogoUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onPatch({ logoDataUrl: ev.target.result });
    reader.readAsDataURL(file);
  }, [onPatch]);

  if (collapsed) {
    return (
      <SpineAdminCard
        title="Company profile"
        subtitle={company.name ? `${company.name} — saved` : 'No company info saved yet.'}
        actions={
          <button type="button" onClick={onToggleCollapse}>Open</button>
        }
      />
    );
  }

  return (
    <SpineAdminCard
      title="Company profile"
      subtitle="Shared invoice defaults carried forward from the v2 light CRM store."
      actions={(
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={onSave}>Save</button>
          <button type="button" onClick={onToggleCollapse}>Close</button>
        </div>
      )}
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <Input label="Company name" value={company.name} onChange={(value) => onPatch({ name: value })} placeholder="Your company" />
          <Input label="Email" value={company.email} onChange={(value) => onPatch({ email: value })} placeholder="billing@domain.com" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <Input label="Address" value={company.address} onChange={(value) => onPatch({ address: value })} placeholder="123 Main St" />
          <Input label="Phone" value={company.phone} onChange={(value) => onPatch({ phone: value })} placeholder="+1 ..." />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <Input label="City" value={company.city} onChange={(value) => onPatch({ city: value })} placeholder="City" />
          <Input label="State" value={company.state} onChange={(value) => onPatch({ state: value })} placeholder="State" />
          <Input label="ZIP" value={company.zip} onChange={(value) => onPatch({ zip: value })} placeholder="ZIP" />
          <Input label="Country" value={company.country} onChange={(value) => onPatch({ country: value })} placeholder="Country" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, alignItems: 'end' }}>
          <div>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#5f6c7b', marginBottom: 6 }}>Logo / Branding</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {company.logoDataUrl && (
                <img src={company.logoDataUrl} alt="logo" style={{ maxWidth: 60, maxHeight: 40, borderRadius: 6, border: '1px solid #e6edf5' }} />
              )}
              <button type="button" onClick={() => fileRef.current?.click()}>
                {company.logoDataUrl ? 'Change' : 'Upload'}
              </button>
              {company.logoDataUrl && (
                <button type="button" onClick={() => onPatch({ logoDataUrl: '' })}>Remove</button>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
            </div>
          </div>

          <div>
            <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#5f6c7b', marginBottom: 6 }}>Local data file</span>
            <div style={{ fontSize: 12, color: '#5f6c7b', marginBottom: 8 }}>
              Select a local JSON file to store customer and invoice data. This keeps your records saved on your machine.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button type="button" onClick={async () => {
                try {
                  if (window.showSaveFilePicker) {
                    const handle = await window.showSaveFilePicker({
                      suggestedName: 'payme-billing-data.json',
                      types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
                    });
                    const data = {
                      company: JSON.parse(localStorage.getItem('payme_v2_company_v1') || '{}'),
                      customers: JSON.parse(localStorage.getItem('payme_v2_customers_v1') || '[]'),
                      invoiceMap: JSON.parse(localStorage.getItem('payme_v2_invoice_map_v1') || '{}'),
                    };
                    const writable = await handle.createWritable();
                    await writable.write(JSON.stringify(data, null, 2));
                    await writable.close();
                    onPatch({ localFilePath: handle.name });
                  } else {
                    alert('Your browser does not support the File System Access API. Use the Import/Export buttons under Customers instead.');
                  }
                } catch (err) {
                  if (err.name !== 'AbortError') console.error(err);
                }
              }}>Save data to file</button>
              <button type="button" onClick={async () => {
                try {
                  if (window.showOpenFilePicker) {
                    const [handle] = await window.showOpenFilePicker({
                      types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
                    });
                    const file = await handle.getFile();
                    const text = await file.text();
                    const data = JSON.parse(text);
                    if (data.company) localStorage.setItem('payme_v2_company_v1', JSON.stringify(data.company));
                    if (data.customers) localStorage.setItem('payme_v2_customers_v1', JSON.stringify(data.customers));
                    if (data.invoiceMap) localStorage.setItem('payme_v2_invoice_map_v1', JSON.stringify(data.invoiceMap));
                    onPatch({ localFilePath: handle.name });
                    window.location.reload();
                  } else {
                    alert('Your browser does not support the File System Access API. Use the Import/Export buttons under Customers instead.');
                  }
                } catch (err) {
                  if (err.name !== 'AbortError') console.error(err);
                }
              }}>Load data from file</button>
            </div>
            {company.localFilePath && (
              <div style={{ fontSize: 12, color: '#166534', marginTop: 6 }}>Connected: {company.localFilePath}</div>
            )}
          </div>
        </div>

        <div style={{ fontSize: 13, color: savedMessage ? '#166534' : '#5f6c7b', minHeight: 18 }}>
          {savedMessage || 'Click Save to persist company profile.'}
        </div>
      </div>
    </SpineAdminCard>
  );
}
