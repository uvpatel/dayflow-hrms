/**
 * Lightweight typed fetch wrapper for Dayflow API
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: unknown;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
    [key: string]: unknown;
  };
  message?: string;
}

export async function apiClient<T>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const json = await res.json().catch(() => ({
    success: false,
    error: `HTTP Error ${res.status}: ${res.statusText}`,
  }));

  if (!res.ok || json.success === false) {
    const errorMsg = json.error || `Request failed with status ${res.status}`;
    const error = new Error(errorMsg);
    (error as Error & { code?: string; details?: unknown; status?: number }).code = json.code;
    (error as Error & { code?: string; details?: unknown; status?: number }).details = json.details;
    (error as Error & { code?: string; details?: unknown; status?: number }).status = res.status;
    throw error;
  }

  return json;
}
