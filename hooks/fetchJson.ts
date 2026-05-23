import { fetch } from 'expo/fetch';

export class HttpError extends Error {
  status: number;

  constructor(status: number, message = `HTTP error! status: ${status}`) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

export async function fetchJson<T>(
  url: string,
  params?: Record<string, string | number | undefined>
): Promise<T> {
  const requestUrl = new URL(url);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value != null) {
        requestUrl.searchParams.set(key, String(value));
      }
    }
  }

  const response = await fetch(requestUrl.toString());

  if (!response.ok) {
    throw new HttpError(response.status);
  }

  return response.json() as Promise<T>;
}
