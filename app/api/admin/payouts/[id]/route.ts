import { z } from "zod";
import { requireAdmin, AuthError } from "@/lib/auth";
import { callReferralEdge } from "@/lib/supabase/edge";
import { ok, fail, serverError } from "@/lib/http";

const schema = z.object({
  status: z.enum(["approved", "paid", "rejected", "cancelled"]),
  adminNote: z.string().trim().max(500).optional().default(""),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    return ok(await callReferralEdge("admin_get_payout_detail", { id }));
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code, e.code === "FORBIDDEN" ? "Forbidden." : "Authentication required.", e.code === "FORBIDDEN" ? 403 : 401);
    return serverError(e);
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid payout update.", 422, parsed.error.flatten());
    return ok(await callReferralEdge("admin_update_payout", { id, ...parsed.data }));
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code, e.code === "FORBIDDEN" ? "Forbidden." : "Authentication required.", e.code === "FORBIDDEN" ? 403 : 401);
    const message = e instanceof Error ? e.message : "Unable to update payout.";
    return fail("VALIDATION_ERROR", message, 400);
  }
}
