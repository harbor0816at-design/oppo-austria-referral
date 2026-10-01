import { NextResponse } from "next/server";
export type ApiErrorCode =
  | "UNAUTHORIZED" | "FORBIDDEN" | "VALIDATION_ERROR" | "NOT_FOUND"
  | "REFERRAL_NOT_FOUND" | "SELF_REFERRAL" | "DUPLICATE_REFERRAL"
  | "INVALID_STATUS_TRANSITION" | "INTERNAL_ERROR";
export function ok<T>(data: T, status = 200) { return NextResponse.json({ success: true, data }, { status }); }
export function fail(code: ApiErrorCode, message: string, status = 400, details?: unknown) {
  return NextResponse.json({ success: false, error: { code, message, ...(details ? { details } : {}) } }, { status });
}
export function serverError(error: unknown) {
  console.error(error);
  return fail("INTERNAL_ERROR", "An unexpected server error occurred.", 500);
}
