import { getSettings } from './storage';

export async function syncCustomerEvent(event) {
  const settings = getSettings();
  if (!settings.crmWebhookUrl) {
    return { skipped: true, reason: 'No CRM webhook configured', event };
  }
  const res = await fetch(settings.crmWebhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(settings.crmApiKey ? { Authorization: `Bearer ${settings.crmApiKey}` } : {}),
    },
    body: JSON.stringify(event),
  }).catch((error) => ({ ok: false, error }));
  if (!res?.ok) {
    return { skipped: false, ok: false, reason: res?.error?.message || 'CRM sync failed' };
  }
  return { ok: true };
}