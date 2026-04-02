import React from 'react';
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

export default function CompanyProfileCard({ company, onPatch, savedMessage }) {
  return (
    <SpineAdminCard
      title="Company profile"
      subtitle="Shared invoice defaults carried forward from the v2 light CRM store."
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

        <div style={{ fontSize: 13, color: savedMessage ? '#166534' : '#5f6c7b', minHeight: 18 }}>
          {savedMessage || 'Changes save directly to local CRM storage.'}
        </div>
      </div>
    </SpineAdminCard>
  );
}
