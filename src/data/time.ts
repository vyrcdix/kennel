// Time helpers per brief §10 (voice) and §14 (hybrid timestamps).
// Within 24h → relative; beyond → absolute. Never both.

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

// Module load anchors `now` so renders within a session are stable.
export const NOW = new Date();

export const minutesAgo = (n: number) => new Date(NOW.getTime() - n * MINUTE);
export const hoursAgo = (n: number) => new Date(NOW.getTime() - n * HOUR);
export const daysAgo = (n: number) => new Date(NOW.getTime() - n * DAY);
export const daysAhead = (n: number) => new Date(NOW.getTime() + n * DAY);

/** "HH:MM" 24h, e.g. "14:32". */
export const formatTime = (d: Date) => {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

/** "may 24" (lowercase mono register). */
export const formatDate = (d: Date) => {
  const month = d.toLocaleString('en-US', { month: 'short' }).toLowerCase();
  return `${month} ${d.getDate()}`;
};

/** ISO yyyy-mm-dd. */
export const formatIsoDate = (d: Date) => d.toISOString().slice(0, 10);

/** "2m ago" / "1h ago" / "yesterday" / "4d ago" / absolute beyond ~7d. */
export const formatRelative = (d: Date, now: Date = NOW): string => {
  const diff = now.getTime() - d.getTime();
  if (diff < 0) return formatDue(d, now);
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 2 * DAY) return 'yesterday';
  if (diff < 60 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return formatDate(d);
};

/** Compact relative without the absolute fallback — for chat last-seen which
 *  always shows a relative count even past 60 days. */
export const formatRelativeLoose = (d: Date, now: Date = NOW): string => {
  const diff = now.getTime() - d.getTime();
  if (diff < MINUTE) return 'just now';
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 2 * DAY) return 'yesterday';
  return `${Math.floor(diff / DAY)}d ago`;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** "today" / "tomorrow" / weekday for next 6 days / "may 24" beyond. */
export const formatDue = (d?: Date | null, now: Date = NOW): string => {
  if (!d) return '—';
  if (sameDay(d, now)) return 'today';
  const tomorrow = new Date(now.getTime() + DAY);
  if (sameDay(d, tomorrow)) return 'tomorrow';
  const diff = Math.floor((d.getTime() - now.getTime()) / DAY);
  if (diff > 0 && diff < 7) {
    return d.toLocaleString('en-US', { weekday: 'short' }).toLowerCase();
  }
  return formatDate(d);
};

/** "monday · 17 may 2026 · 14:32 PDT" for the dashboard heading. */
export const formatDashboardDate = (now: Date = NOW): string => {
  const weekday = now.toLocaleString('en-US', { weekday: 'long' }).toLowerCase();
  const day = now.getDate();
  const month = now.toLocaleString('en-US', { month: 'short' }).toLowerCase();
  const year = now.getFullYear();
  const tz =
    now
      .toLocaleString('en-US', { timeZoneName: 'short' })
      .split(' ')
      .pop() || '';
  return `${weekday} · ${day} ${month} ${year} · ${formatTime(now)} ${tz}`;
};

/** Chat stale threshold (days). Default per brief, project may override. */
export const STALE_CHAT_DAYS = 60;

export const isStale = (d: Date, threshold = STALE_CHAT_DAYS, now: Date = NOW) =>
  now.getTime() - d.getTime() > threshold * DAY;
