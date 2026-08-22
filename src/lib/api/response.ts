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

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    const formatted = formatZodError(error);
    return NextResponse.json(
      {
        success: false,
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: formatted,
      },
      { status: 400 }
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code,
        ...(error.details !== undefined && { details: error.details }),
      },
      { status: error.statusCode }
    );
  }

  const message = error instanceof Error ? error.message : "Internal server error";
  return NextResponse.json(
    {
      success: false,
      error: message,
      code: "INTERNAL_SERVER_ERROR",
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
