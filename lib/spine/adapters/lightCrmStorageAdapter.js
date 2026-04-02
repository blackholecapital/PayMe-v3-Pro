import {
  getCompanyProfile,
  saveCompanyProfile,
  getCustomers,
  upsertCustomer,
  deleteCustomer,
  getInvoiceMap,
  mapInvoiceToCustomer,
} from '../../../src/services/adminStore.js';

export function loadCrmSnapshot() {
  return {
    company: getCompanyProfile(),
    customers: getCustomers(),
    invoiceMap: getInvoiceMap(),
  };
}

export function saveCompanyPatch(patch) {
  return saveCompanyProfile(patch || {});
}

export function saveCustomer(customer) {
  return upsertCustomer(customer || {});
}

export function removeCustomer(customerId) {
  return deleteCustomer(customerId);
}

export function attachInvoiceToCustomer({ invoiceRef, customerId }) {
  return mapInvoiceToCustomer({ invoiceRef, customerId });
}
