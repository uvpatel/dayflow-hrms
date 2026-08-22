import { NextRequest } from "next/server";
import { z, ZodSchema } from "zod";
import { ValidationError } from "./errors";

export async function validateBody<T>(request: NextRequest, schema: ZodSchema<T>): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError("Invalid JSON in request body");
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}

export function validateQuery<T>(searchParams: URLSearchParams, schema: ZodSchema<T>): T {
  const queryObj: Record<string, string> = {};
  searchParams.forEach((val, key) => {
    queryObj[key] = val;
  });

  const result = schema.safeParse(queryObj);
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}

export async function validateParams<T>(
  paramsPromise: Promise<Record<string, string | string[] | undefined>>,
  schema: ZodSchema<T>
): Promise<T> {
  const params = await paramsPromise;
  const result = schema.safeParse(params);
  if (!result.success) {
    throw result.error;
  }
  return result.data;
}

export const numericIdParamSchema = z.object({
  id: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Valid numeric ID parameter is required",
    }),
});

export const employeeIdParamSchema = z.object({
  employeeId: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Valid numeric employeeId parameter is required",
    }),
});

export const departmentIdParamSchema = z.object({
  departmentId: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Valid numeric departmentId parameter is required",
    }),
});

export const requestIdParamSchema = z.object({
  requestId: z
    .string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val > 0, {
      message: "Valid numeric requestId parameter is required",
    }),
});
