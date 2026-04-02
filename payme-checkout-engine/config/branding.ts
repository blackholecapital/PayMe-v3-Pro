export const defaultBranding = {
  companyName: 'PayMe',
  accentColor: '#2f7df6',
  footerText: 'Powered by PayMe',
  checkoutTitle: 'Payment request',
  checkoutSubtitle: 'Fast card or Base USDC checkout.',
};

export function resolveBranding(overrides = {}) {
  return { ...defaultBranding, ...overrides };
}