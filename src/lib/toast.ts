// Tiny toast queue. No deps, no animation library. The single Toaster
// component (mounted at App root) subscribes via useToasts().
//
// Default lifetime: 4s; errors stick for 8s so the user actually reads
// them. Click-to-dismiss is wired in Toaster.tsx.

import { useEffect, useState } from 'react';

export type ToastKind = 'info' | 'error';

export type Toast = {
  id: number;
  kind: ToastKind;
  message: string;
  detail?: string;
};

const DEFAULT_MS: Record<ToastKind, number> = {
  info: 4000,
  error: 8000,
};

let seq = 0;
let toasts: Toast[] = [];
const listeners = new Set<(t: Toast[]) => void>();

const emit = () => {
  for (const fn of listeners) fn(toasts);
};

export const showToast = (
  message: string,
  opts: { kind?: ToastKind; detail?: string; ttlMs?: number } = {},
): number => {
  const kind = opts.kind ?? 'info';
  const id = ++seq;
  toasts = [...toasts, { id, kind, message, detail: opts.detail }];
  emit();
  window.setTimeout(() => dismissToast(id), opts.ttlMs ?? DEFAULT_MS[kind]);
  return id;
};

export const dismissToast = (id: number): void => {
  const next = toasts.filter((t) => t.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
};

export const useToasts = (): Toast[] => {
  const [v, setV] = useState<Toast[]>(toasts);
  useEffect(() => {
    listeners.add(setV);
    return () => {
      listeners.delete(setV);
    };
  }, []);
  return v;
};

/** Convenience for action-layer error paths. Pulls something readable out
 *  of common error shapes (ApiError, ValidationError) and surfaces it. */
export const toastError = (where: string, err: unknown): void => {
  const message = `${where} failed`;
  let detail: string | undefined;
  if (err && typeof err === 'object') {
    if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
      detail = (err as { message: string }).message;
    }
    if ('fields' in err) {
      const fields = (err as { fields: Record<string, string> }).fields;
      const first = Object.entries(fields)[0];
      if (first) detail = `${first[0]}: ${first[1]}`;
    }
  }
  showToast(message, { kind: 'error', detail });
};
