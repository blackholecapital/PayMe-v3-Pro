const NEXT_INVOICE_NUMBER_KEY = 'payme_v2_next_invoice_number_v1';
const INVOICE_START_NUMBER = 1001;

export function getNextInvoiceNumber(history = []) {
  try {
    const raw = localStorage.getItem(NEXT_INVOICE_NUMBER_KEY);
    const fromStorage = parseInt(raw || '', 10);
    if (Number.isFinite(fromStorage)) return `INV-${fromStorage}`;
  } catch {}

  let maxSeen = 0;
  for (const row of history || []) {
    const match = String(row?.invoiceRef || '').match(/^INV-(\d+)$/);
    if (!match) continue;
    const num = parseInt(match[1], 10);
    if (Number.isFinite(num)) maxSeen = Math.max(maxSeen, num);
  }
  return `INV-${maxSeen ? (maxSeen + 1) : INVOICE_START_NUMBER}`;
}

export function commitInvoiceNumber(invoiceRef) {
  const match = String(invoiceRef || '').match(/^INV-(\d+)$/);
  if (!match) return;
  const current = parseInt(match[1], 10);
  if (!Number.isFinite(current)) return;
  try {
    localStorage.setItem(NEXT_INVOICE_NUMBER_KEY, String(current + 1));
  } catch {}
}
