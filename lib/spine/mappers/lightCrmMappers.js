export function mapCustomerOption(customer) {
  const email = String(customer?.email || '').trim();
  return {
    value: customer?.id || '',
    label: email ? `${customer?.name || 'Unnamed'} (${email})` : (customer?.name || 'Unnamed'),
  };
}

export function mapHistoryRow(row, source = 'history') {
  return {
    source,
    ts: row?.ts || Date.now(),
    invoiceRef: row?.invoiceRef || '',
    amountDisplay: row?.amountDisplay || row?.amountUsd || '',
    txHash: row?.txHash || '',
    chainId: row?.chainId || '',
    status: row?.status || row?.kind || '',
    customerEmail: row?.customerEmail || '',
    customerName: row?.customerName || '',
  };
}

export function mapInboundPingRow(row, source = 'inbound') {
  return {
    source,
    ts: row?.ts || Date.now(),
    invoiceRef: row?.invoiceRef || row?.requestId || '',
    amountDisplay: row?.amountDisplay || row?.amountUsd || '',
    txHash: row?.txHash || '',
    chainId: row?.chainId || '',
    status: row?.status || 'inbound',
    customerEmail: row?.customerEmail || '',
    customerName: row?.customerName || '',
  };
}
