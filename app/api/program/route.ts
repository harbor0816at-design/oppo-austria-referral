import { requireUser, AuthError } from "@/lib/auth";
import { callReferralEdge } from "@/lib/supabase/edge";
import { ok, fail, serverError } from "@/lib/http";

export async function GET() {
  try {
    await requireUser();
    const data = await callReferralEdge("member_program_data");
    return ok(data);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code, "Authentication required.", 401);
    return serverError(e);
  }
}
