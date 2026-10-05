import { z } from "zod";
import { requireAdmin, AuthError } from "@/lib/auth";
import { callReferralEdge } from "@/lib/supabase/edge";
import { ok, fail, serverError } from "@/lib/http";

const schema = z.object({
  status: z.enum(["paper_received","approved","rejected"]),
  reviewNote: z.string().trim().max(1000).optional().default(""),
});

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await ctx.params;
    return ok(await callReferralEdge("admin_get_agreement_detail", { id }));
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
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid agreement review.", 422, parsed.error.flatten());
    if (parsed.data.status === "paper_received") {
      return ok(await callReferralEdge("admin_mark_paper_received", { id, reviewNote: parsed.data.reviewNote }));
    }
    return ok(await callReferralEdge("admin_update_agreement", { id, ...parsed.data }));
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code, e.code === "FORBIDDEN" ? "Forbidden." : "Authentication required.", e.code === "FORBIDDEN" ? 403 : 401);
    const message = e instanceof Error ? e.message : "Unable to review agreement.";
    return fail("VALIDATION_ERROR", message, 400);
  }
}
