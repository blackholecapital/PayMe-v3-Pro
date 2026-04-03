import React, { useCallback, useRef } from 'react';
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
            <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#5f6c7b', marginBottom: 6 }}>Local data storage</span>
            <div style={{ fontSize: 12, color: '#5f6c7b' }}>
              Customer and invoice data is stored in your browser's local storage. Use the Import/Export buttons under Customers to back up or migrate data.
            </div>
          </div>
        </div>

        <div style={{ fontSize: 13, color: savedMessage ? '#166534' : '#5f6c7b', minHeight: 18 }}>
          {savedMessage || 'Click Save to persist company profile.'}
        </div>
      </div>
    </SpineAdminCard>
  );
}
