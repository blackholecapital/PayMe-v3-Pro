import { useCallback, useMemo, useState } from 'react';
import { getSettings } from '../../../payme-checkout-engine/lib/storage.ts';
import { upsertPaymentRequest } from '../../../payme-checkout-engine/lib/paymentRequests.ts';
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
};

function toPaymentLink(requestId) {
  return `${window.location.origin}${window.location.pathname}?pay=${requestId}`;
}

export default function useLightCrm() {
  const snapshot = useMemo(() => loadCrmSnapshot(), []);
  const timelineSeed = useMemo(() => listCrmTimeline(), []);

  const [company, setCompany] = useState(snapshot.company);
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

  const settings = useMemo(() => getSettings(), []);
  const effectiveItems = useMemo(() => normalizeInvoiceItems(invoiceItems), [invoiceItems]);
  const computedTotal = useMemo(() => computeInvoiceTotal(invoiceItems), [invoiceItems]);
  const effectiveAmount = useMemo(() => computedTotal > 0 ? formatMoney(computedTotal) : amount, [computedTotal, amount]);
  const selectedCustomer = useMemo(
    () => customers.find((customer) => customer.id === selectedCustomerId) || null,
    [customers, selectedCustomerId],
  );

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
    flash(setSavedMessage, 'Company saved');
  }, [flash]);

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
    company,
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
    setSubject,
    setAmount,
    setInvoiceNumber,
    setCustomerDraft,
    setInvoiceItems,
    handleCompanyPatch,
    handleCustomerSelect,
    handleCustomerSave,
    handleCustomerDelete,
    createPaymentRequest,
    handleCopyLink,
    handleDownloadText,
    handleDownloadHtml,
    mailtoHref,
    refreshTimeline,
  };
}
