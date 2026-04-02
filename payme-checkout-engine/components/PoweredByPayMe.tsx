import React from 'react';
import { resolveBranding } from '../config/branding';
import { getSettings } from '../lib/storage';

export default function PoweredByPayMe() {
  const settings = getSettings();
  const branding = resolveBranding({
    companyName: settings.companyName,
    footerText: settings.footerText,
  });

  return (
    <div style={{ marginTop: 20, textAlign: 'center', color: '#2f7df6', fontSize: 13 }}>
      {branding.footerText || 'Powered by PayMe'}
    </div>
  );
}
