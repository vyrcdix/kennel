import type { DB } from '../db.js';
import { validationError } from '../errors.js';
import { fromIso, nowIso } from '../time.js';
import type { Settings } from '../../../shared/types.js';

type SettingsRow = {
  id: number;
  aging_threshold_days: number;
  filing_prompt_days: number;
  created_at: string;
  updated_at: string;
};

const rowToSettings = (r: SettingsRow): Settings => ({
  agingThresholdDays: r.aging_threshold_days,
  filingPromptDays: r.filing_prompt_days as 0 | 90 | 180,
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
  if (Object.keys(fields).length) throw validationError(fields);

  const now = nowIso();
  const current = getSettings(db);
  const next: Settings = {
    agingThresholdDays: patch.agingThresholdDays ?? current.agingThresholdDays,
    filingPromptDays: patch.filingPromptDays ?? current.filingPromptDays,
    createdAt: current.createdAt,
    updatedAt: new Date(now),
  };
  db.prepare(
    `UPDATE settings
     SET aging_threshold_days = ?, filing_prompt_days = ?, updated_at = ?
     WHERE id = 1`,
  ).run(next.agingThresholdDays, next.filingPromptDays, now);
  return next;
};
