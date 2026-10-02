import { requireAdmin, AuthError } from "@/lib/auth";
import { callReferralEdge } from "@/lib/supabase/edge";
import { ok, fail, serverError } from "@/lib/http";

export async function GET() {
  try {
    await requireAdmin();
    const data = await callReferralEdge("admin_program_snapshot");
    return ok(data);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code, e.code === "FORBIDDEN" ? "Forbidden." : "Authentication required.", e.code === "FORBIDDEN" ? 403 : 401);
    return serverError(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json();
    const action = String(body?.action || "");
    const allowed = new Set(["admin_save_product","admin_save_asset","admin_save_settings","admin_save_sale"]);
    if (!allowed.has(action)) return fail("VALIDATION_ERROR", "Unsupported admin action.", 422);
    const data = await callReferralEdge(action, body?.payload || {});
    return ok(data);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code, e.code === "FORBIDDEN" ? "Forbidden." : "Authentication required.", e.code === "FORBIDDEN" ? 403 : 401);
    return serverError(e);
  }
}
