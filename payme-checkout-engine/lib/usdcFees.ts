/**
 * USDC fee configuration.
 * Edit /usdc-fees.json in the project root to change the fee % or recipient.
 */
import feeConfig from '../../usdc-fees.json';

export function getUsdcFeeConfig() {
  return {
    feePercent: Number(feeConfig.feePercent ?? 1),
    feeRecipient: String(feeConfig.feeRecipient ?? ''),
  };
}

/**
 * Split a payment amount into merchant + fee amounts.
 * Returns raw BigInt values (6 decimals for USDC).
 */
export function splitUsdcPayment(totalRaw: bigint): {
  merchantAmount: bigint;
  feeAmount: bigint;
  feeRecipient: string;
  feePercent: number;
} {
  const { feePercent, feeRecipient } = getUsdcFeeConfig();
  if (!feePercent || !feeRecipient || feeRecipient === '0x0000000000000000000000000000000000000000') {
    return { merchantAmount: totalRaw, feeAmount: 0n, feeRecipient: '', feePercent: 0 };
  }
  const feeAmount = (totalRaw * BigInt(Math.round(feePercent * 100))) / 10000n;
  const merchantAmount = totalRaw - feeAmount;
  return { merchantAmount, feeAmount, feeRecipient, feePercent };
}
