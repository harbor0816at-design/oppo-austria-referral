import { z } from "zod";
import { requireUser, AuthError } from "@/lib/auth";
import { callReferralEdge } from "@/lib/supabase/edge";
import { ok, fail, serverError } from "@/lib/http";

const schema = z.object({
  accountHolder: z.string().trim().min(2).max(120),
  iban: z.string().trim().max(64).optional().default(""),
  bic: z.string().trim().max(32).optional().default(""),
  country: z.string().trim().length(2).optional().default("AT"),
});

export async function PUT(req: Request) {
  try {
    await requireUser();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid bank account details.", 422, parsed.error.flatten());
    return ok(await callReferralEdge("member_save_payout_account", parsed.data));
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code, "Authentication required.", 401);
    const message = e instanceof Error ? e.message : "Unable to save bank account.";
    return fail("VALIDATION_ERROR", message, 400);
  }
}
