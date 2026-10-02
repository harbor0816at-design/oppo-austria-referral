import { requireUser, AuthError } from "@/lib/auth";
import { callReferralEdge } from "@/lib/supabase/edge";
import { ok, fail, serverError } from "@/lib/http";

export async function GET() {
  try {
    await requireUser();
    return ok(await callReferralEdge("member_get_payout"));
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code, "Authentication required.", 401);
    return serverError(e);
  }
}

export async function POST() {
  try {
    await requireUser();
    return ok(await callReferralEdge("member_create_payout_request"), 201);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code, "Authentication required.", 401);
    const message = e instanceof Error ? e.message : "Unable to create payout request.";
    return fail("VALIDATION_ERROR", message, 400);
  }
}
