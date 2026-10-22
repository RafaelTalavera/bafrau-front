import { HttpErrorResponse } from '@angular/common/http';

export interface ApiErrorResponse {
  timestamp: string;
  status: number;
  error: string;
  code: string;
  message: string;
  path: string;
  fieldErrors?: Readonly<Record<string, string>>;
  correlationId: string;
}

export type ApiErrorDetails = Partial<ApiErrorResponse>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function parseApiError(value: unknown): ApiErrorDetails | null {
  if (!isRecord(value)) return null;
  const details: ApiErrorDetails = {};
  const stringFields = ['timestamp', 'error', 'code', 'message', 'path', 'correlationId'] as const;
  stringFields.forEach(field => {
    const parsed = readString(value[field]);
    if (parsed) details[field] = parsed;
  });
  if (typeof value['status'] === 'number') details.status = value['status'];
  if (isRecord(value['fieldErrors'])) {
    const fieldErrors: Record<string, string> = {};
    Object.entries(value['fieldErrors']).forEach(([field, fieldMessage]) => {
      const parsed = readString(fieldMessage);
      if (parsed) fieldErrors[field] = parsed;
    });
    if (Object.keys(fieldErrors).length) details.fieldErrors = fieldErrors;
  }
  return Object.keys(details).length ? details : null;
}

export function correlationIdFrom(error: HttpErrorResponse, details: ApiErrorDetails | null): string | null {
  return details?.correlationId ?? readString(error.headers?.get('X-Correlation-ID')) ?? null;
}
