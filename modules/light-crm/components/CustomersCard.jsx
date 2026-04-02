import React from 'react';
import SpineAdminCard from '../../../lib/spine/wrappers/SpineAdminCard.jsx';
import { mapCustomerOption } from '../../../lib/spine/mappers/lightCrmMappers.js';

function Input({ label, value, onChange, placeholder }) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#5f6c7b', marginBottom: 6 }}>{label}</span>
      <input value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} style={{ width: '100%' }} />
    </label>
  );
}

export default function CustomersCard({
  customers,
  selectedCustomerId,
  customerDraft,
  onSelect,
  onDraftChange,
  onSave,
  onDelete,
}) {
  const options = customers.map(mapCustomerOption);

  return (
    <SpineAdminCard
      title="Customers"
      subtitle="Customer records stay isolated in the light CRM module and sync through spine adapters."
      actions={(
        <>
          <button type="button" onClick={onSave}>Save customer</button>
          <button type="button" onClick={onDelete} disabled={!selectedCustomerId}>Delete</button>
        </>
      )}
    >
      <div style={{ display: 'grid', gap: 12 }}>
        <label style={{ display: 'block' }}>
          <span style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#5f6c7b', marginBottom: 6 }}>Select customer</span>
          <select value={selectedCustomerId || ''} onChange={(e) => onSelect(e.target.value)} style={{ width: '100%' }}>
            <option value="">New customer</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <Input label="Name" value={customerDraft.name} onChange={(value) => onDraftChange({ ...customerDraft, name: value })} placeholder="ABC Company" />
          <Input label="Email" value={customerDraft.email} onChange={(value) => onDraftChange({ ...customerDraft, email: value })} placeholder="customer@domain.com" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <Input label="Attention" value={customerDraft.attention} onChange={(value) => onDraftChange({ ...customerDraft, attention: value })} placeholder="Accounts payable" />
          <Input label="Phone" value={customerDraft.phone} onChange={(value) => onDraftChange({ ...customerDraft, phone: value })} placeholder="+1 ..." />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          <Input label="Address" value={customerDraft.address} onChange={(value) => onDraftChange({ ...customerDraft, address: value })} placeholder="123 Main St" />
          <Input label="City" value={customerDraft.city} onChange={(value) => onDraftChange({ ...customerDraft, city: value })} placeholder="City" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <Input label="State" value={customerDraft.state} onChange={(value) => onDraftChange({ ...customerDraft, state: value })} placeholder="State" />
          <Input label="ZIP" value={customerDraft.zip} onChange={(value) => onDraftChange({ ...customerDraft, zip: value })} placeholder="ZIP" />
          <Input label="Country" value={customerDraft.country} onChange={(value) => onDraftChange({ ...customerDraft, country: value })} placeholder="Country" />
        </div>
      </div>
    </SpineAdminCard>
  );
}
