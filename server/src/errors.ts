import type { NextFunction, Request, Response } from 'express';
import type { ApiErrorBody } from '../../shared/errors.js';

export class HttpError extends Error {
  status: number;
  body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(typeof body === 'object' && 'message' in body ? (body as any).message : body.error);
    this.status = status;
    this.body = body;
  }
}

export const validationError = (fields: Record<string, string>) =>
  new HttpError(400, { error: 'validation_error', fields });

export const slugConflict = (conflict: { id: string; name: string }) =>
  new HttpError(409, { error: 'slug_conflict', conflicting_project: conflict });

export const notFound = (entity: string, id?: string) =>
  new HttpError(404, { error: 'not_found', entity, id });

export const stateConflict = (message: string) =>
  new HttpError(409, { error: 'state_conflict', message });

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

export const errorMiddleware = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof HttpError) {
    res.status(err.status).json(err.body);
    return;
  }
  console.error('[error]', err);
  const message = err instanceof Error ? err.message : 'unknown';
  const body: ApiErrorBody = { error: 'internal_error', message };
  res.status(500).json(body);
};
