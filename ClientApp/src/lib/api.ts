import { getApiUrl } from '../config/dataSource';
import { beginRequest, endRequest } from './loadingBus';

const getToken = () => localStorage.getItem('pms_token');

async function fetchJson(endpoint: string, options: RequestInit = {}) {
  const url = `${getApiUrl()}${endpoint}`;
  const token = getToken();
  beginRequest();
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      if (response.status === 401) {
        if (!endpoint.startsWith('/auth/')) window.location.href = '/auth';
        throw new Error(errorBody.message || 'Invalid email or password');
      }
      if (response.status === 403) {
        throw new Error(errorBody.message || 'Access Denied: You do not have permission to perform this action.');
      }
      throw new Error(errorBody.message || `API error: ${response.status}`);
    }
    return await response.json();
  } finally {
    endRequest();
  }
}

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const json = await fetchJson(endpoint, options);
  if (json && typeof json === 'object' && 'success' in json && 'data' in json) {
    return json.data as T;
  }
  return json as T;
}

export interface ApiPageMeta {
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PagedResult<T> {
  data: T;
  meta: ApiPageMeta;
}

/** Like apiRequest but also returns pagination metadata from the ApiResponse envelope. */
export async function apiRequestWithMeta<T>(endpoint: string, options: RequestInit = {}): Promise<PagedResult<T>> {
  const json = await fetchJson(endpoint, options);
  const data = (json && typeof json === 'object' && 'success' in json && 'data' in json)
    ? (json.data as T)
    : (json as T);
  const meta: ApiPageMeta = {
    totalCount: json?.totalCount ?? 0,
    page:       json?.page       ?? 1,
    pageSize:   json?.pageSize   ?? 0,
    totalPages: json?.totalPages ?? 1,
  };
  return { data, meta };
}
