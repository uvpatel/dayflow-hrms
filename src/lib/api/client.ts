/**
 * Lightweight typed fetch wrapper for Dayflow API
 */

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?:
    | string
    | {
        code?: string;
        message: string;
        fields?: Record<string, string[]>;
      };
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

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

/**
 * Supports both the canonical `{ data: T[], meta }` envelope and the older
 * `{ data: { items, total } }` envelope while routes are being consolidated.
 */
export function getPaginatedData<T>(
  response: ApiResponse<T[] | { items: T[]; total: number }>
): PaginatedData<T> {
  const data = response.data;

  if (Array.isArray(data)) {
    return {
      items: data,
      total: response.meta?.total ?? data.length,
      page: response.meta?.page,
      limit: response.meta?.limit,
      totalPages: response.meta?.totalPages,
    };
  }

  if (data && "items" in data && Array.isArray(data.items)) {
    return {
      items: data.items,
      total: data.total,
      page: response.meta?.page,
      limit: response.meta?.limit,
      totalPages: response.meta?.totalPages,
    };
  }

  return { items: [], total: 0 };
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
    const errorPayload = json.error;
    const errorMsg =
      typeof errorPayload === "string"
        ? errorPayload
        : errorPayload?.message || `Request failed with status ${res.status}`;
    throw new ApiClientError(
      errorMsg,
      res.status,
      json.code || (typeof errorPayload === "object" ? errorPayload?.code : undefined),
      json.details ??
        (typeof errorPayload === "object" ? errorPayload?.fields : undefined),
    );
  }

  return json;
}

type JsonRequestOptions = Omit<RequestInit, "body" | "method">;

function withJsonBody(body: unknown, options?: JsonRequestOptions): RequestInit {
  return { ...options, body: body === undefined ? undefined : JSON.stringify(body) };
}

export const api = {
  get: <T>(url: string, options?: JsonRequestOptions) =>
    apiClient<T>(url, { ...options, method: "GET" }),
  post: <T>(url: string, body?: unknown, options?: JsonRequestOptions) =>
    apiClient<T>(url, { ...withJsonBody(body, options), method: "POST" }),
  put: <T>(url: string, body?: unknown, options?: JsonRequestOptions) =>
    apiClient<T>(url, { ...withJsonBody(body, options), method: "PUT" }),
  patch: <T>(url: string, body?: unknown, options?: JsonRequestOptions) =>
    apiClient<T>(url, { ...withJsonBody(body, options), method: "PATCH" }),
  delete: <T>(url: string, options?: JsonRequestOptions) =>
    apiClient<T>(url, { ...options, method: "DELETE" }),
};
