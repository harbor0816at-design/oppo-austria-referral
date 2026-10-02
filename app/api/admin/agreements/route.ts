import { requireAdmin, AuthError } from "@/lib/auth";
import { callReferralEdge } from "@/lib/supabase/edge";
import { ok, fail, serverError } from "@/lib/http";

export async function GET() {
  try {
    await requireAdmin();
    return ok(await callReferralEdge("admin_list_agreements"));
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code, e.code === "FORBIDDEN" ? "Forbidden." : "Authentication required.", e.code === "FORBIDDEN" ? 403 : 401);
    return serverError(e);
  }
}
