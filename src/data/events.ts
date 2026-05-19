// SSE client. Subscribes to /api/events at boot, refetches /api/bootstrap and
// re-hydrates the local cache on activity events. Debounced so a burst of
// server-side mutations (e.g. Claude proposing several items in a row) collapses
// into one bootstrap refresh.

import { api } from './api';
import { hydrate, type BootstrapPayload } from './fixtures';

const DEBOUNCE_MS = 200;

let timer: number | undefined;
let source: EventSource | undefined;

const refresh = async () => {
  try {
    const payload = await api.get<BootstrapPayload>('/api/bootstrap');
    hydrate(payload);
  } catch (err) {
    console.warn('[events] bootstrap refresh failed', err);
  }
};

const scheduleRefresh = () => {
  window.clearTimeout(timer);
  timer = window.setTimeout(refresh, DEBOUNCE_MS);
};

export const startEventStream = () => {
  if (source) return;
  source = new EventSource('/api/events');
  source.addEventListener('activity', scheduleRefresh);
  source.addEventListener('error', () => {
    // EventSource auto-reconnects; nothing to do here. Errors during normal
    // reconnect bursts would spam the console — suppress.
  });
};

export const stopEventStream = () => {
  source?.close();
  source = undefined;
  window.clearTimeout(timer);
};
