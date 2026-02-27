import { logger } from './logger.js';

export interface DomotzCredentials {
  apiKey: string;
  region: string;
}

export function getCredentials(): DomotzCredentials | null {
  const apiKey = process.env.DOMOTZ_API_KEY;
  if (!apiKey) {
    logger.warn('Missing DOMOTZ_API_KEY');
    return null;
  }
  return {
    apiKey,
    region: process.env.DOMOTZ_REGION || 'us-east-1',
  };
}

export function getBaseUrl(region: string = 'us-east-1'): string {
  return `https://api-${region}-cell-1.domotz.com/public-api/v1`;
}

export async function domotzRequest<T>(path: string, options: {
  method?: string;
  params?: Record<string, string | number | undefined>;
  body?: unknown;
} = {}): Promise<T> {
  const creds = getCredentials();
  if (!creds) throw new Error('No Domotz credentials configured. Set DOMOTZ_API_KEY.');

  const baseUrl = getBaseUrl(creds.region);
  const url = new URL(`${baseUrl}${path}`);

  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }
  }

  logger.debug('Domotz API request', { method: options.method || 'GET', path });

  const res = await fetch(url.toString(), {
    method: options.method || 'GET',
    headers: {
      'X-Api-Key': creds.apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const rawText = await res.text();
  let body: unknown;
  try { body = JSON.parse(rawText); } catch { body = rawText; }

  if (!res.ok) {
    logger.error('Domotz API error', { status: res.status, path });
    throw new Error(`Domotz API error ${res.status}: ${rawText}`);
  }

  return body as T;
}
