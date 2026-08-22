import { PaginationMeta } from "./response";

export interface ParsedPagination {
  page: number;
  limit: number;
  offset: number;
  search?: string;
  sortBy?: string;
  sortOrder: "asc" | "desc";
}

export function parsePagination(
  searchParams: URLSearchParams,
  defaultLimit = 20,
  maxLimit = 100
): ParsedPagination {
  const rawPage = Number(searchParams.get("page"));
  const rawLimit = Number(searchParams.get("limit") ?? searchParams.get("pageSize"));
  const page = !isNaN(rawPage) && rawPage > 0 ? rawPage : 1;
  const limitCandidate = !isNaN(rawLimit) && rawLimit > 0 ? rawLimit : defaultLimit;
  const limit = Math.min(limitCandidate, maxLimit);
  const offset = (page - 1) * limit;

  const search = searchParams.get("search")?.trim() || undefined;
  const sortBy = searchParams.get("sortBy")?.trim() || undefined;
  const sortOrder = searchParams.get("sortOrder")?.toLowerCase() === "asc" ? "asc" : "desc";

  return {
    page,
    limit,
    offset,
    search,
    sortBy,
    sortOrder,
  };
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
  extras?: Record<string, unknown>
): PaginationMeta {
  const totalPages = Math.ceil(total / limit) || 1;
  return {
    page,
    limit,
    total,
    totalPages,
    ...extras,
  };
}
