import type { DB } from '../db.js';
import { validationError } from '../errors.js';
import { fromIso, nowIso } from '../time.js';
import type { Settings } from '../../../shared/types.js';

type SettingsRow = {
  id: number;
  aging_threshold_days: number;
  filing_prompt_days: number;
  dormant_threshold_days: number;
  show_temperature: number;
  resurface_interval_days: number;
  routing_daily_cap: number;
  routing_confidence_threshold: number;
  created_at: string;
  updated_at: string;
};

const rowToSettings = (r: SettingsRow): Settings => ({
  agingThresholdDays: r.aging_threshold_days,
  filingPromptDays: r.filing_prompt_days as 0 | 90 | 180,
  dormantThresholdDays: r.dormant_threshold_days,
  showTemperature: r.show_temperature !== 0,
  resurfaceIntervalDays: r.resurface_interval_days ?? 30,
  routingDailyCap: r.routing_daily_cap ?? 200,
  routingConfidenceThreshold: r.routing_confidence_threshold ?? 0.55,
  createdAt: fromIso(r.created_at)!,
  updatedAt: fromIso(r.updated_at)!,
});

export const getSettings = (db: DB): Settings => {
  const row = db
    .prepare<[], SettingsRow>('SELECT * FROM settings WHERE id = 1')
    .get()!;
  return rowToSettings(row);
};

export type SettingsPatch = {
  agingThresholdDays?: number;
  filingPromptDays?: 0 | 90 | 180;
  dormantThresholdDays?: number;
  showTemperature?: boolean;
  resurfaceIntervalDays?: number;
  routingDailyCap?: number;
  routingConfidenceThreshold?: number;
};

export const updateSettings = (db: DB, patch: SettingsPatch): Settings => {
  const fields: Record<string, string> = {};
  if (patch.agingThresholdDays !== undefined) {
    const n = patch.agingThresholdDays;
    if (!Number.isInteger(n) || n < 7 || n > 180) fields.agingThresholdDays = 'out_of_range';
  }
  if (patch.filingPromptDays !== undefined) {
    if (![0, 90, 180].includes(patch.filingPromptDays)) fields.filingPromptDays = 'invalid';
  }
  if (patch.dormantThresholdDays !== undefined) {
    const n = patch.dormantThresholdDays;
    if (!Number.isInteger(n) || n < 30 || n > 365) fields.dormantThresholdDays = 'out_of_range';
  }
  if (patch.showTemperature !== undefined && typeof patch.showTemperature !== 'boolean') {
    fields.showTemperature = 'invalid';
  }
  if (patch.resurfaceIntervalDays !== undefined) {
    const n = patch.resurfaceIntervalDays;
    if (!Number.isInteger(n) || n < 7 || n > 180) fields.resurfaceIntervalDays = 'out_of_range';
  }
  if (patch.routingDailyCap !== undefined) {
    const n = patch.routingDailyCap;
    if (!Number.isInteger(n) || n < 1 || n > 500) fields.routingDailyCap = 'out_of_range';
  }
  if (patch.routingConfidenceThreshold !== undefined) {
    const n = patch.routingConfidenceThreshold;
    if (typeof n !== 'number' || n < 0.3 || n > 0.85) {
      fields.routingConfidenceThreshold = 'out_of_range';
    }
  }
  if (Object.keys(fields).length) throw validationError(fields);

  const now = nowIso();
  const current = getSettings(db);
  const next: Settings = {
    agingThresholdDays: patch.agingThresholdDays ?? current.agingThresholdDays,
    filingPromptDays: patch.filingPromptDays ?? current.filingPromptDays,
    dormantThresholdDays: patch.dormantThresholdDays ?? current.dormantThresholdDays,
    showTemperature: patch.showTemperature ?? current.showTemperature,
    resurfaceIntervalDays:
      patch.resurfaceIntervalDays ?? current.resurfaceIntervalDays,
    routingDailyCap: patch.routingDailyCap ?? current.routingDailyCap,
    routingConfidenceThreshold:
      patch.routingConfidenceThreshold ?? current.routingConfidenceThreshold,
    createdAt: current.createdAt,
    updatedAt: new Date(now),
  };
  db.prepare(
    `UPDATE settings
     SET aging_threshold_days = ?,
         filing_prompt_days = ?,
         dormant_threshold_days = ?,
         show_temperature = ?,
         resurface_interval_days = ?,
         routing_daily_cap = ?,
         routing_confidence_threshold = ?,
         updated_at = ?
     WHERE id = 1`,
  ).run(
    next.agingThresholdDays,
    next.filingPromptDays,
    next.dormantThresholdDays,
    next.showTemperature ? 1 : 0,
    next.resurfaceIntervalDays,
    next.routingDailyCap,
    next.routingConfidenceThreshold,
    now,
  );
  return next;
};
