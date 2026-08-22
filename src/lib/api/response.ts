import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError, formatZodError } from "./errors";

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  [key: string]: unknown;
}

export function successResponse<T>(
  data: T,
  meta?: Record<string, unknown>,
  message?: string,
  status = 200
) {
  return NextResponse.json(
    {
      success: true,
      ...(message && { message }),
      data,
      ...(meta && { meta }),
    },
    { status }
  );
}

export function createdResponse<T>(data: T, message = "Resource created successfully") {
  return successResponse(data, undefined, message, 201);
}

export function paginatedResponse<T>(
  data: T[],
  meta: PaginationMeta,
  message?: string
) {
  return successResponse(data, meta, message, 200);
}

export function noContentResponse() {
  return new NextResponse(null, { status: 204 });
}

function validationFields(
  details: unknown,
): Record<string, string[]> | undefined {
  if (!Array.isArray(details)) return undefined;

  const fields: Record<string, string[]> = {};
  for (const detail of details) {
    if (
      typeof detail !== "object" ||
      detail === null ||
      !("message" in detail) ||
      typeof detail.message !== "string"
    ) {
      continue;
    }
    const path =
      "path" in detail && typeof detail.path === "string" && detail.path
        ? detail.path
        : "_root";
    fields[path] = [...(fields[path] ?? []), detail.message];
  }
  return Object.keys(fields).length ? fields : undefined;
}

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    const formatted = formatZodError(error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Validation failed",
          fields: validationFields(formatted),
        },
      },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(validationFields(error.details) && {
            fields: validationFields(error.details),
          }),
        },
      },
      { status: error.statusCode }
    );
  }

  console.error("Unhandled API error", error);
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Internal server error",
      },
    },
    { status: 500 }
  );
}

export function handleApiRoute<T>(handler: () => Promise<NextResponse<T>> | NextResponse<T>) {
  return async () => {
    try {
      return await handler();
    } catch (err) {
      return errorResponse(err);
    }
  };
}
