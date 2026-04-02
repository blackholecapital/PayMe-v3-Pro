function esc(value) {
  return String(value || '').replace(/[&<>"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
  }[char]));
}

export function buildMailtoHref({ emailTo, subject, body }) {
  if (!emailTo) return '';
  const mailto = new URL(`mailto:${emailTo}`);
  if (subject) mailto.searchParams.set('subject', subject);
  if (body) mailto.searchParams.set('body', body);
  return mailto.toString();
}

export function buildTxUrl(txHash, chainId) {
  if (!txHash) return '';
  if (String(chainId) === '8453') return `https://basescan.org/tx/${txHash}`;
  if (String(chainId) === '1') return `https://etherscan.io/tx/${txHash}`;
  return '';
}

export function downloadTextFile({ filename, content, mime = 'text/plain' }) {
  const blob = new Blob([content], { type: mime });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 5000);
}

export function formatMoney(n) {
  const x = Number(n || 0);
  if (!Number.isFinite(x)) return '';
  return x
    .toFixed(3)
    .replace(/\.0+$/, '')
    .replace(/(\.[0-9]*?)0+$/, '$1')
    .replace(/\.$/, '');
}

export function normalizeInvoiceItems(items = []) {
  return items
    .map((it) => ({
      desc: String(it?.desc || ''),
      qty: it?.qty === '' || it?.qty == null ? '' : String(it.qty),
      unit: it?.unit === '' || it?.unit == null ? '' : String(it.unit),
    }))
    .filter((it, idx) => {
      const d = it.desc.trim();
      const q = Number(it.qty || 0);
      const u = Number(it.unit || 0);
      if (idx > 0 && !d) return false;
      return Boolean(d || q || u);
    });
}

export function computeInvoiceTotal(items = []) {
  return normalizeInvoiceItems(items).reduce((sum, item) => {
    const qty = Number(item.qty || 0);
    const unit = Number(item.unit || 0);
    return qty && unit ? sum + (qty * unit) : sum;
  }, 0);
}

export function buildInvoiceWireText({ company, customer, invoiceNumber, amount, items, generatedLink }) {
  const lines = [];
  lines.push(company?.name ? company.name : 'INVOICE');

  const companyAddr = [
    company?.address,
    [company?.city, company?.state, company?.zip].filter(Boolean).join(' '),
    company?.country,
  ].filter(Boolean).join(', ');
  if (companyAddr) lines.push(companyAddr);

  const companyContact = [company?.email, company?.phone].filter(Boolean).join(' | ');
  if (companyContact) lines.push(companyContact);

  lines.push('');
  lines.push('BILL TO');
  lines.push(customer?.name ? customer.name : '');

  const customerAddr = [
    customer?.address,
    [customer?.city, customer?.state, customer?.zip].filter(Boolean).join(' '),
    customer?.country,
  ].filter(Boolean).join(', ');
  if (customerAddr) lines.push(customerAddr);

  if (customer?.attention) lines.push(`Attn: ${customer.attention}`);
  const customerContact = [customer?.email, customer?.phone].filter(Boolean).join(' | ');
  if (customerContact) lines.push(customerContact);

  if (invoiceNumber) {
    lines.push('');
    lines.push(`Invoice: ${invoiceNumber}`);
  }

  const cleanItems = normalizeInvoiceItems(items);
  if (cleanItems.length) {
    lines.push('');
    lines.push('ITEMS');
    cleanItems.forEach((item) => {
      const qty = Number(item.qty || 0);
      const unit = Number(item.unit || 0);
      const total = qty && unit ? qty * unit : 0;
      lines.push(`- ${item.desc}${qty || unit ? ` | qty ${qty || 0} | unit ${unit || 0} | total ${total || 0}` : ''}`);
    });
  }

  if (amount) {
    lines.push('');
    lines.push(`Total due: ${amount} USDC`);
  }
  if (generatedLink) {
    lines.push('');
    lines.push(`Pay link: ${generatedLink}`);
  }

  return lines.filter(Boolean).join('\n');
}

export function buildInvoiceHtml({ company, customer, invoiceNumber, amount, items, generatedLink, createdAt }) {
  const dateStr = createdAt ? new Date(createdAt).toLocaleDateString() : new Date().toLocaleDateString();
  const rows = normalizeInvoiceItems(items);

  const companyAddr = [
    company?.address,
    [company?.city, company?.state, company?.zip].filter(Boolean).join(' '),
    company?.country,
  ].filter(Boolean).join('<br/>');

  const customerAddr = [
    customer?.address,
    [customer?.city, customer?.state, customer?.zip].filter(Boolean).join(' '),
    customer?.country,
  ].filter(Boolean).join('<br/>');

  const rowHtml = rows.length
    ? rows.map((item) => {
        const qty = Number(item.qty || 0);
        const unit = Number(item.unit || 0);
        const total = qty && unit ? qty * unit : 0;
        return `
          <tr>
            <td style="padding:8px 10px;border-bottom:1px solid #e5ebf2;">${esc(item.desc)}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e5ebf2;text-align:right;">${esc(item.qty)}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e5ebf2;text-align:right;">${esc(item.unit)}</td>
            <td style="padding:8px 10px;border-bottom:1px solid #e5ebf2;text-align:right;">${esc(formatMoney(total))}</td>
          </tr>
        `;
      }).join('')
    : `
      <tr>
        <td colspan="4" style="padding:12px 10px;color:#5f6c7b;">No line items added.</td>
      </tr>
    `;

  return `
    <div style="font-family:Arial,sans-serif;color:#0f172a;max-width:900px;margin:0 auto;padding:24px;">
      <div style="display:flex;justify-content:space-between;gap:24px;align-items:flex-start;">
        <div>
          ${company?.logoDataUrl ? `<img src="${company.logoDataUrl}" alt="logo" style="max-width:110px;max-height:70px;display:block;margin-bottom:12px;" />` : ''}
          <div style="font-size:24px;font-weight:700;color:#2f7df6;">${esc(company?.name || 'Invoice')}</div>
          <div style="margin-top:8px;line-height:1.5;">${companyAddr}</div>
          <div style="margin-top:8px;line-height:1.5;">${esc([company?.email, company?.phone].filter(Boolean).join(' | '))}</div>
        </div>
        <div style="min-width:220px;">
          <div style="font-size:28px;font-weight:700;">INVOICE</div>
          <div style="margin-top:12px;"><b>Invoice #:</b> ${esc(invoiceNumber || '—')}</div>
          <div style="margin-top:6px;"><b>Date:</b> ${esc(dateStr)}</div>
          <div style="margin-top:6px;"><b>Total Due:</b> ${esc(amount || '')} USDC</div>
        </div>
      </div>

      <div style="margin-top:28px;padding:16px;border:1px solid #e5ebf2;border-radius:16px;background:#f8fbff;">
        <div style="font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:#5f6c7b;margin-bottom:8px;">Bill To</div>
        <div><b>${esc(customer?.name || '')}</b></div>
        <div style="margin-top:6px;line-height:1.5;">${customerAddr}</div>
        ${customer?.attention ? `<div style="margin-top:6px;">Attn: ${esc(customer.attention)}</div>` : ''}
        <div style="margin-top:6px;">${esc([customer?.email, customer?.phone].filter(Boolean).join(' | '))}</div>
      </div>

      <table style="width:100%;margin-top:24px;border-collapse:collapse;border:1px solid #e5ebf2;border-radius:16px;overflow:hidden;">
        <thead>
          <tr style="background:#eef5ff;">
            <th style="padding:10px;text-align:left;">Description</th>
            <th style="padding:10px;text-align:right;">Qty</th>
            <th style="padding:10px;text-align:right;">Unit</th>
            <th style="padding:10px;text-align:right;">Total</th>
          </tr>
        </thead>
        <tbody>${rowHtml}</tbody>
      </table>

      ${generatedLink ? `<div style="margin-top:24px;"><b>Pay link:</b> <a href="${generatedLink}">${generatedLink}</a></div>` : ''}
    </div>
  `;
}
