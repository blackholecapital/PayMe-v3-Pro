const CFG_KEY = 'usdc_xyz_admin_cfg_v1'
const HIST_KEY = 'usdc_xyz_local_history_v1'
const INBOUND_KEY = 'usdc_xyz_inbound_pings_v1'

export function loadAdminConfig() {
  try {
    const raw = localStorage.getItem(CFG_KEY)
    return raw ? JSON.parse(raw) : { receiveAddress: '', alertEmail: '' }
  } catch {
    return { receiveAddress: '', alertEmail: '' }
  }
}

export function saveAdminConfig({ receiveAddress, alertEmail }) {
  const obj = {
    receiveAddress: (receiveAddress || '').trim(),
    alertEmail: (alertEmail || '').trim(),
    ts: Date.now(),
  }
  try { localStorage.setItem(CFG_KEY, JSON.stringify(obj)) } catch {}
  return obj
}

export function appendLocalHistory(entry) {
  try {
    const arr = getLocalHistory()
    arr.unshift({ ...entry, ts: entry?.ts || Date.now() })
    localStorage.setItem(HIST_KEY, JSON.stringify(arr.slice(0, 200)))
  } catch {}
}

export function getLocalHistory() {
  try {
    const raw = localStorage.getItem(HIST_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function clearLocalHistory() {
  try { localStorage.removeItem(HIST_KEY) } catch {}
}
// ===========================
// Inbound pings (PAYME V2 / confirmations)
// ===========================
export function appendInboundPing(entry) {
  try {
    const arr = getInboundPings()
    arr.unshift({ ...entry, ts: entry?.ts || Date.now() })
    localStorage.setItem(INBOUND_KEY, JSON.stringify(arr.slice(0, 200)))
  } catch {}
}

export function getInboundPings() {
  try {
    const raw = localStorage.getItem(INBOUND_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function clearInboundPings() {
  try { localStorage.removeItem(INBOUND_KEY) } catch {}
}

const COMPANY_KEY = 'payme_v2_company_v1'
const CUSTOMERS_KEY = 'payme_v2_customers_v1'
const INVOICE_MAP_KEY = 'payme_v2_invoice_map_v1'

export function getCompanyProfile() {
  try {
    const raw = localStorage.getItem(COMPANY_KEY)
    return raw ? JSON.parse(raw) : {
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
    }
  } catch {
    return {
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
    }
  }
}

export function saveCompanyProfile(patch) {
  const cur = getCompanyProfile()
  const next = { ...cur, ...(patch || {}), ts: Date.now() }
  try { localStorage.setItem(COMPANY_KEY, JSON.stringify(next)) } catch {}
  return next
}

/* ===========================
   PAYME V2 - Customers
   =========================== */
export function getCustomers() {
  try {
    const raw = localStorage.getItem(CUSTOMERS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function upsertCustomer(customer) {
  const arr = getCustomers()
  const now = Date.now()
  const c = { ...(customer || {}) }
  if (!c.id) c.id = `c_${now}_${Math.random().toString(16).slice(2)}`
  c.name = (c.name || '').trim()
  c.email = (c.email || '').trim()
  c.updatedTs = now
  if (!c.createdTs) c.createdTs = now
  if (!Array.isArray(c.history)) c.history = []

  const idx = arr.findIndex((x) => x.id === c.id)
  if (idx >= 0) arr[idx] = c
  else arr.unshift(c)

  try { localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(arr.slice(0, 500))) } catch {}
  return c
}

export function deleteCustomer(customerId) {
  const arr = getCustomers().filter((c) => c.id !== customerId)
  try { localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(arr)) } catch {}
  return arr
}

/* ===========================
   PAYME V2 - Invoice map
   =========================== */
export function getInvoiceMap() {
  try {
    const raw = localStorage.getItem(INVOICE_MAP_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function mapInvoiceToCustomer({ invoiceRef, customerId }) {
  const inv = (invoiceRef || '').trim()
  if (!inv || !customerId) return
  const m = getInvoiceMap()
  m[inv] = { customerId, ts: Date.now() }
  try { localStorage.setItem(INVOICE_MAP_KEY, JSON.stringify(m)) } catch {}
}

export function clearInvoiceMap() {
  try { localStorage.removeItem(INVOICE_MAP_KEY) } catch {}
}

/* ===========================
   PAYME V2 - Attach history
   =========================== */
function tryAttachHistoryToCustomer(row) {
  const invoiceRef = (row?.invoiceRef || '').trim()
  if (!invoiceRef) return
  const m = getInvoiceMap()
  const hit = m[invoiceRef]
  if (!hit?.customerId) return

  const arr = getCustomers()
  const idx = arr.findIndex((c) => c.id === hit.customerId)
  if (idx < 0) return

  const c = { ...arr[idx] }
  if (!Array.isArray(c.history)) c.history = []

  c.history.unshift({
    ts: row.ts || Date.now(),
    invoiceRef,
    amountDisplay: row.amountDisplay || '',
    txHash: row.txHash || '',
    chainId: row.chainId || '',
    status: row.status || row.kind || '',
  })
  c.history = c.history.slice(0, 200)
  c.updatedTs = Date.now()

  arr[idx] = c
  try { localStorage.setItem(CUSTOMERS_KEY, JSON.stringify(arr)) } catch {}
}
