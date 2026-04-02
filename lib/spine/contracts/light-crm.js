export const LIGHT_CRM_MODULE_KEY = 'crm';

export const emptyCompanyProfile = {
  name: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  email: '',
  phone: '',
  logoDataUrl: '',
  ts: 0,
};

export const emptyCustomerDraft = {
  id: '',
  name: '',
  email: '',
  attention: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  history: [],
  createdTs: 0,
  updatedTs: 0,
};

export const emptyInvoiceItem = {
  desc: '',
  qty: '',
  unit: '',
};

export const lightCrmContract = {
  moduleKey: LIGHT_CRM_MODULE_KEY,
  displayName: 'Light CRM',
  storageKeys: {
    company: 'payme_v2_company_v1',
    customers: 'payme_v2_customers_v1',
    invoiceMap: 'payme_v2_invoice_map_v1',
    history: 'usdc_xyz_local_history_v1',
    inbound: 'usdc_xyz_inbound_pings_v1',
  },
};
