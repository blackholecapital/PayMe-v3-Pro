import { getLocalHistory, getInboundPings } from '../../../src/services/adminStore.js';
import { mapHistoryRow, mapInboundPingRow } from '../mappers/lightCrmMappers.js';

export function listCrmTimeline() {
  const history = getLocalHistory().map((row) => mapHistoryRow(row, 'history'));
  const inbound = getInboundPings().map((row) => mapInboundPingRow(row, 'inbound'));
  return [...history, ...inbound]
    .sort((a, b) => Number(b.ts || 0) - Number(a.ts || 0))
    .slice(0, 200);
}
