/** ISO-8601 UTC timestamp. The single canonical format we round-trip with the client. */
export const nowIso = (): string => new Date().toISOString();

export const toIso = (d: Date): string => d.toISOString();
export const fromIso = (s: string | null | undefined): Date | undefined =>
  s ? new Date(s) : undefined;
