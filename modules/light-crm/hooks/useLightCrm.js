import { useCallback, useMemo, useState } from 'react';
import { getSettings } from '../../../payme-checkout-engine/lib/storage.ts';
import { upsertPaymentRequest, listPaymentRequests } from '../../../payme-checkout-engine/lib/paymentRequests.ts';
import { copyText } from '../../../src/utils/format.js';
import {
  loadCrmSnapshot,
  saveCompanyPatch,
  saveCustomer,
  removeCustomer,
  attachInvoiceToCustomer,
} from '../../../lib/spine/adapters/lightCrmStorageAdapter.js';
import { listCrmTimeline } from '../../../lib/spine/adapters/lightCrmHistoryAdapter.js';
import { getNextInvoiceNumber, commitInvoiceNumber } from '../lib/invoiceNumbers.js';
import {
  buildMailtoHref,
  buildInvoiceWireText,
  buildInvoiceHtml,
  downloadTextFile,
  computeInvoiceTotal,
  normalizeInvoiceItems,
  formatMoney,
} from '../lib/invoiceBuilders.js';

const EMPTY_ITEM = { desc: '', qty: '', unit: '' };
const EMPTY_CUSTOMER = {
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
  recurring: false,
};

const CRM_TABS = [
  { key: 'company', label: 'Company Profile' },
  { key: 'customers', label: 'Customers' },
  { key: 'preview', label: 'Invoice Preview' },
  { key: 'recurring', label: 'Recurring Billing' },
  { key: 'open', label: 'Open Invoices' },
  { key: 'history', label: 'History' },
];

function toPaymentLink(requestId) {
  return `${window.location.origin}${window.location.pathname}?pay=${requestId}`;
}

export default function useLightCrm() {
  const snapshot = useMemo(() => loadCrmSnapshot(), []);
  const timelineSeed = useMemo(() => listCrmTimeline(), []);

  const [activeTab, setActiveTab] = useState('customers');
  const [company, setCompany] = useState(snapshot.company);
  const [companyCollapsed, setCompanyCollapsed] = useState(false);
  const [customers, setCustomers] = useState(snapshot.customers);
  const [timeline, setTimeline] = useState(timelineSeed);
  const [selectedCustomerId, setSelectedCustomerId] = useState(snapshot.customers[0]?.id || '');
  const [customerDraft, setCustomerDraft] = useState(snapshot.customers[0] || EMPTY_CUSTOMER);
  const [invoiceNumber, setInvoiceNumber] = useState(getNextInvoiceNumber(timelineSeed));
  const [subject, setSubject] = useState('Invoice for services');
  const [invoiceItems, setInvoiceItems] = useState([{ ...EMPTY_ITEM }]);
  const [amount, setAmount] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [recurringRunDate, setRecurringRunDate] = useState(1);

  const settings = useMemo(() => getSettings(), []);
  const effectiveItems = useMemo(() => normalizeInvoiceItems(invoiceItems), [invoiceItems]);
  const computedTotal = useMemo(() => computeInvoiceTotal(invoiceItems), [invoiceItems]);
  const effectiveAmount = useMemo(() => computedTotal > 0 ? formatMoney(computedTotal) : amount, [computedTotal, amount]);
  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId) || null,
    [customers, selectedCustomerId],
  );

  const recurringCustomers = useMemo(
    () => customers.filter((c) => c.recurring),
    [customers],
  );

  const openInvoices = useMemo(() => {
    try {
      return listPaymentRequests().filter((r) => r.status === 'open' || r.status === 'pending');
    } catch {
      return [];
    }
  }, [statusMessage, savedMessage]);

  const refreshTimeline = useCallback(() => {
    setTimeline(listCrmTimeline());
  }, []);

  const flash = useCallback((setter, message) => {
    setter(message);
    setTimeout(() => setter(''), 2200);
  }, []);

  const handleCompanyPatch = useCallback((patch) => {
    const next = saveCompanyPatch(patch);
    setCompany(next);
  }, []);

  const handleCompanySave = useCallback(() => {
    const next = saveCompanyPatch(company);
    setCompany(next);
    flash(setSavedMessage, 'Company profile saved');
  }, [company, flash]);

  const handleCustomerSelect = useCallback((customerId) => {
    setSelectedCustomerId(customerId);
    const match = customers.find((customer) => customer.id === customerId) || EMPTY_CUSTOMER;
    setCustomerDraft(match);
  }, [customers]);

  const handleCustomerSave = useCallback(() => {
    if (!String(customerDraft?.name || '').trim()) return;
    const saved = saveCustomer(customerDraft);
    const next = loadCrmSnapshot().customers;
    setCustomers(next);
    setSelectedCustomerId(saved.id);
    setCustomerDraft(next.find((customer) => customer.id === saved.id) || saved);
    flash(setSavedMessage, 'Customer saved');
  }, [customerDraft, flash]);

  const handleCustomerDelete = useCallback(() => {
    if (!selectedCustomerId) return;
    removeCustomer(selectedCustomerId);
    const next = loadCrmSnapshot().customers;
    setCustomers(next);
    setSelectedCustomerId(next[0]?.id || '');
    setCustomerDraft(next[0] || EMPTY_CUSTOMER);
    flash(setSavedMessage, 'Customer removed');
  }, [selectedCustomerId, flash]);

  const handleToggleRecurring = useCallback((customerId, value) => {
    const arr = customers.map((c) =>
      c.id === customerId ? { ...c, recurring: value } : c,
    );
    const target = arr.find((c) => c.id === customerId);
    if (target) saveCustomer(target);
    setCustomers(arr);
    if (customerDraft.id === customerId) {
      setCustomerDraft((prev) => ({ ...prev, recurring: value }));
    }
  }, [customers, customerDraft]);

  const createPaymentRequest = useCallback(() => {
    const customer = selectedCustomer || customerDraft || EMPTY_CUSTOMER;
    const nextRequest = upsertPaymentRequest({
      customerEmail: customer.email || '',
      customerName: customer.name || '',
      amountUsd: Number(effectiveAmount || 0),
      description: effectiveItems.map((item) => item.desc).filter(Boolean).join(', ') || subject || invoiceNumber,
      status: 'open',
    });
    const nextLink = toPaymentLink(nextRequest.id);
    if (invoiceNumber && customer?.id) {
      attachInvoiceToCustomer({ invoiceRef: invoiceNumber, customerId: customer.id });
    }
    setGeneratedLink(nextLink);
    commitInvoiceNumber(invoiceNumber);
    setInvoiceNumber(getNextInvoiceNumber(listCrmTimeline()));
    flash(setStatusMessage, 'Payment link created');
    return { request: nextRequest, link: nextLink };
  }, [selectedCustomer, customerDraft, effectiveAmount, effectiveItems, subject, invoiceNumber, flash]);

  const handleCopyLink = useCallback(async () => {
    if (!generatedLink) return;
    await copyText(generatedLink);
    flash(setStatusMessage, 'Link copied');
  }, [generatedLink, flash]);

  const handleDownloadText = useCallback(() => {
    const customer = selectedCustomer || customerDraft || EMPTY_CUSTOMER;
    downloadTextFile({
      filename: `${invoiceNumber || 'invoice'}.txt`,
      content: buildInvoiceWireText({
        company,
        customer,
        invoiceNumber,
        amount: effectiveAmount,
        items: invoiceItems,
        generatedLink,
      }),
      mime: 'text/plain',
    });
  }, [company, selectedCustomer, customerDraft, invoiceNumber, effectiveAmount, invoiceItems, generatedLink]);

  const handleDownloadHtml = useCallback(() => {
    const customer = selectedCustomer || customerDraft || EMPTY_CUSTOMER;
    downloadTextFile({
      filename: `${invoiceNumber || 'invoice'}.html`,
      content: buildInvoiceHtml({
        company,
        customer,
        invoiceNumber,
        amount: effectiveAmount,
        items: invoiceItems,
        generatedLink,
        createdAt: Date.now(),
      }),
      mime: 'text/html',
    });
  }, [company, selectedCustomer, customerDraft, invoiceNumber, effectiveAmount, invoiceItems, generatedLink]);

  const handlePrintPdf = useCallback(() => {
    const customer = selectedCustomer || customerDraft || EMPTY_CUSTOMER;
    const html = buildInvoiceHtml({
      company,
      customer,
      invoiceNumber,
      amount: effectiveAmount,
      items: invoiceItems,
      generatedLink,
      createdAt: Date.now(),
    });
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html><head><title>${invoiceNumber || 'Invoice'}</title></head><body>${html}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 400);
  }, [company, selectedCustomer, customerDraft, invoiceNumber, effectiveAmount, invoiceItems, generatedLink]);

  const handlePrintRecurringPdf = useCallback(() => {
    if (!recurringCustomers.length) return;
    const pages = recurringCustomers.map((customer) => {
      return buildInvoiceHtml({
        company,
        customer,
        invoiceNumber: invoiceNumber || 'INV-BATCH',
        amount: effectiveAmount,
        items: invoiceItems,
        generatedLink: '',
        createdAt: Date.now(),
      });
    });
    const w = window.open('', '_blank');
    if (!w) return;
    const combined = pages.join('<div style="page-break-after:always;"></div>');
    w.document.write(`<!DOCTYPE html><html><head><title>Recurring Invoices</title><style>@media print { .page-break { page-break-after: always; } }</style></head><body>${combined}</body></html>`);
    w.document.close();
    setTimeout(() => { w.print(); }, 400);
  }, [recurringCustomers, company, invoiceNumber, effectiveAmount, invoiceItems]);

  const handleExportCustomers = useCallback((format) => {
    if (format === 'csv') {
      const headers = ['Name', 'Email', 'Attention', 'Phone', 'Address', 'City', 'State', 'ZIP', 'Country', 'Recurring'];
      const rows = customers.map((c) => [c.name, c.email, c.attention, c.phone, c.address, c.city, c.state, c.zip, c.country, c.recurring ? 'Yes' : 'No'].map((v) => `"${String(v || '').replace(/"/g, '""')}"`).join(','));
      downloadTextFile({ filename: 'customers.csv', content: [headers.join(','), ...rows].join('\n'), mime: 'text/csv' });
    } else {
      downloadTextFile({ filename: 'customers.json', content: JSON.stringify(customers, null, 2), mime: 'application/json' });
    }
  }, [customers]);

  const handleImportCustomers = useCallback((file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        if (file.name.endsWith('.json')) {
          const arr = JSON.parse(text);
          if (Array.isArray(arr)) {
            arr.forEach((c) => {
              if (c.name) saveCustomer({ ...EMPTY_CUSTOMER, ...c, id: '' });
            });
          }
        } else {
          const lines = text.split('\n').filter(Boolean);
          const header = lines[0].toLowerCase();
          if (header.includes('name')) {
            lines.slice(1).forEach((line) => {
              const cols = line.split(',').map((v) => v.replace(/^"|"$/g, '').trim());
              if (cols[0]) {
                saveCustomer({
                  ...EMPTY_CUSTOMER,
                  id: '',
                  name: cols[0] || '',
                  email: cols[1] || '',
                  attention: cols[2] || '',
                  phone: cols[3] || '',
                  address: cols[4] || '',
                  city: cols[5] || '',
                  state: cols[6] || '',
                  zip: cols[7] || '',
                  country: cols[8] || '',
                  recurring: (cols[9] || '').toLowerCase() === 'yes',
                });
              }
            });
          }
        }
        const next = loadCrmSnapshot().customers;
        setCustomers(next);
        flash(setSavedMessage, 'Customers imported');
      } catch {
        flash(setSavedMessage, 'Import failed - check file format');
      }
    };
    reader.readAsText(file);
  }, [flash]);

  const mailtoHref = useMemo(() => {
    const customer = selectedCustomer || customerDraft || EMPTY_CUSTOMER;
    const body = buildInvoiceWireText({
      company,
      customer,
      invoiceNumber,
      amount: effectiveAmount,
      items: invoiceItems,
      generatedLink,
    });
    return buildMailtoHref({
      emailTo: customer.email || '',
      subject: invoiceNumber ? `${subject}, ${invoiceNumber}` : subject,
      body,
    });
  }, [company, selectedCustomer, customerDraft, invoiceNumber, effectiveAmount, invoiceItems, generatedLink, subject]);

  return {
    CRM_TABS,
    activeTab,
    setActiveTab,
    company,
    companyCollapsed,
    setCompanyCollapsed,
    customers,
    timeline,
    selectedCustomerId,
    customerDraft,
    invoiceNumber,
    subject,
    invoiceItems,
    effectiveAmount,
    generatedLink,
    savedMessage,
    statusMessage,
    settings,
    selectedCustomer,
    recurringCustomers,
    recurringRunDate,
    setRecurringRunDate,
    openInvoices,
    setSubject,
    setAmount,
    setInvoiceNumber,
    setCustomerDraft,
    setInvoiceItems,
    handleCompanyPatch,
    handleCompanySave,
    handleCustomerSelect,
    handleCustomerSave,
    handleCustomerDelete,
    handleToggleRecurring,
    createPaymentRequest,
    handleCopyLink,
    handleDownloadText,
    handleDownloadHtml,
    handlePrintPdf,
    handlePrintRecurringPdf,
    handleExportCustomers,
    handleImportCustomers,
    mailtoHref,
    refreshTimeline,
  };
}
