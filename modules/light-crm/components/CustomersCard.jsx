import React, { useRef, useState } from 'react';
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

function Toggle({ label, checked, onChange }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#5f6c7b' }}>
      <span>{label}</span>
      <div
        onClick={(e) => { e.preventDefault(); onChange(!checked); }}
        style={{
          width: 40,
          height: 22,
          borderRadius: 11,
          background: checked ? '#2f7df6' : '#d5dce5',
          position: 'relative',
          transition: 'background .2s',
          cursor: 'pointer',
        }}
      >
        <div style={{
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 2,
          left: checked ? 20 : 2,
          transition: 'left .2s',
          boxShadow: '0 1px 3px rgba(0,0,0,.15)',
        }} />
      </div>
      <span style={{ fontSize: 12, color: checked ? '#166534' : '#94a3b8' }}>{checked ? 'On' : 'Off'}</span>
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
  onToggleRecurring,
  onExport,
  onImport,
}) {
  const options = customers.map(mapCustomerOption);
  const importRef = useRef(null);
  const [exportFormat, setExportFormat] = useState('csv');

  return (
    <SpineAdminCard
      title="Customers"
      subtitle="Customer records stay isolated in the light CRM module and sync through spine adapters."
      actions={(
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button type="button" onClick={onSave}>Save customer</button>
          <button type="button" onClick={onDelete} disabled={!selectedCustomerId}>Delete</button>
          <Toggle
            label="Recurring billing"
            checked={!!customerDraft.recurring}
            onChange={(val) => {
              onDraftChange({ ...customerDraft, recurring: val });
              if (selectedCustomerId) onToggleRecurring(selectedCustomerId, val);
            }}
          />
        </div>
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

        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', paddingTop: 8, borderTop: '1px solid #e6edf5' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#5f6c7b' }}>Import / Export</span>
          <select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} style={{ fontSize: 13, padding: '4px 8px' }}>
            <option value="csv">CSV</option>
            <option value="json">JSON</option>
          </select>
          <button type="button" onClick={() => onExport(exportFormat)}>Export</button>
          <button type="button" onClick={() => importRef.current?.click()}>Import</button>
          <input ref={importRef} type="file" accept=".csv,.json" style={{ display: 'none' }} onChange={(e) => { onImport(e.target.files?.[0]); e.target.value = ''; }} />
        </div>
      </div>
    </SpineAdminCard>
  );
}
