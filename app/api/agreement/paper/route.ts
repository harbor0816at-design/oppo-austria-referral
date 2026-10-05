import { z } from "zod";
import { requireUser, AuthError } from "@/lib/auth";
import { callReferralEdge } from "@/lib/supabase/edge";
import { ok, fail, serverError } from "@/lib/http";

const schema = z.object({
  signerName: z.string().trim().min(2).max(160).optional().default(""),
  language: z.enum(["de","en","zh"]).default("de"),
});

export async function POST(req: Request) {
  try {
    await requireUser();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail("VALIDATION_ERROR","Invalid paper contract request.",422,parsed.error.flatten());
    return ok(await callReferralEdge("member_request_paper_agreement", parsed.data),201);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code,"Authentication required.",e.code==="UNAUTHORIZED"?401:403);
    const message=e instanceof Error?e.message:"Unable to request paper agreement.";
    return fail("VALIDATION_ERROR",message,400);
  }
}
