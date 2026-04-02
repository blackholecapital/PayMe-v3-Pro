import { API_BASE } from '../config/api.js'

function nowTs() {
  return Date.now()
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`
    throw new Error(msg)
  }
  return data
}

export async function submitPayment({ invoiceRef, amountDisplay, amountRaw, chainId, fromAddress, toAddress, txHash, alertEmail }) {
  if (!API_BASE) return { skipped: true }
  return postJson(`${API_BASE}/api/payments/submit`, {
    invoiceRef: String(invoiceRef ?? ''),
    amountDisplay: String(amountDisplay ?? ''),
    amountRaw: String(amountRaw ?? ''),
    chainId,
    fromAddress: String(fromAddress ?? ''),
    toAddress: String(toAddress ?? ''),
    txHash: String(txHash ?? ''),
    alertEmail: String(alertEmail ?? ''),
    source: 'usdc.xyz-labs.xyz',
    ts: nowTs(),
  })
}

export async function confirmPayment({ invoiceRef, chainId, fromAddress, toAddress, amountDisplay, txHash, alertEmail }) {
  if (!API_BASE) return { skipped: true }
  return postJson(`${API_BASE}/api/payments/confirm`, {
    invoiceRef: String(invoiceRef ?? ''),
    chainId,
    fromAddress: String(fromAddress ?? ''),
    toAddress: String(toAddress ?? ''),
    amountDisplay: String(amountDisplay ?? ''),
    txHash: String(txHash ?? ''),
    alertEmail: String(alertEmail ?? ''),
    source: 'usdc.xyz-labs.xyz',
    ts: nowTs(),
  })
}

export async function getPaymentStatus({ invoiceRef, txHash }) {
  if (!API_BASE) return { status: 'UNKNOWN', skipped: true }
  const u = new URL(`${API_BASE}/api/payments/status`)
  u.searchParams.set('invoiceRef', String(invoiceRef ?? ''))
  u.searchParams.set('txHash', String(txHash ?? ''))
  const res = await fetch(u.toString(), { method: 'GET' })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data?.error || data?.message || `HTTP ${res.status}`
    throw new Error(msg)
  }
  return data
}
