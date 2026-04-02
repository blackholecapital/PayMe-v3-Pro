export function shortAddr(addr) {
  if (!addr) return ''
  const a = String(addr)
  if (a.length <= 12) return a
  return a.slice(0, 6) + '…' + a.slice(-4)
}

export async function copyText(text) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // no-op
  }
}
