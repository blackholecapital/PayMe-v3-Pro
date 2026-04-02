import { USDC_DECIMALS } from '../config/constants.js'

const re = /^\d+(\.\d+)?$/

export function displayToRaw(display) {
  const s = (display || '').trim()
  if (!s) throw new Error('Amount is required')
  if (!re.test(s)) throw new Error('Invalid amount format')
  const num = Number(s)
  if (!Number.isFinite(num) || num <= 0) throw new Error('Amount must be > 0')

  const [whole, frac = ''] = s.split('.')
  if (frac.length > USDC_DECIMALS) throw new Error(`Too many decimals (max ${USDC_DECIMALS})`)

  const fracPadded = (frac + '0'.repeat(USDC_DECIMALS)).slice(0, USDC_DECIMALS)
  const rawStr = `${whole}${fracPadded}`.replace(/^0+/, '') || '0'
  const raw = BigInt(rawStr)
  if (raw <= 0n) throw new Error('Amount must be > 0')
  return raw
}
