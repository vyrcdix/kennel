// Shared HTTP error code constants — used by both server (response generation)
// and client (response parsing & translating to typed exceptions).

export type ErrorCode =
  | 'validation_error'
  | 'slug_conflict'
  | 'not_found'
  | 'state_conflict'
  | 'internal_error';

export type ValidationErrorBody = {
  error: 'validation_error';
  fields: Record<string, string>;
};

export type SlugConflictBody = {
  error: 'slug_conflict';
  conflicting_project: { id: string; name: string };
};

export type NotFoundBody = {
  error: 'not_found';
  entity: string;
  id?: string;
};

export type ApiErrorBody =
  | ValidationErrorBody
  | SlugConflictBody
  | NotFoundBody
  | { error: 'state_conflict'; message: string }
  | { error: 'internal_error'; message: string };
