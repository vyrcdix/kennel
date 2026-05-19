import { ulid } from 'ulid';

/** Time-sortable, URL-safe id. Wraps the ulid lib so we can swap impls later. */
export const newId = (prefix?: string): string =>
  prefix ? `${prefix}_${ulid()}` : ulid();
