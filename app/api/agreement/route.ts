import { z } from "zod";
import { requireUser, AuthError } from "@/lib/auth";
import { callReferralEdge } from "@/lib/supabase/edge";
import { ok, fail, serverError } from "@/lib/http";

const schema = z.object({
  signerName: z.string().trim().min(2).max(160),
  signaturePath: z.string().trim().min(3).max(500),
  language: z.enum(["de","en","zh"]).default("de"),
});

export async function GET() {
  try {
    await requireUser();
    return ok(await callReferralEdge("member_agreement_status"));
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code, "Authentication required.", e.code === "UNAUTHORIZED" ? 401 : 403);
    return serverError(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireUser();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid agreement submission.", 422, parsed.error.flatten());
    return ok(await callReferralEdge("member_submit_agreement", parsed.data), 201);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code, "Authentication required.", e.code === "UNAUTHORIZED" ? 401 : 403);
    const message = e instanceof Error ? e.message : "Unable to submit agreement.";
    return fail("VALIDATION_ERROR", message, 400);
  }
}
