import { z } from "zod";
import { requireAdmin, AuthError } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { ok, fail, serverError } from "@/lib/http";

const schema = z.object({
  password: z.string().min(12).max(128),
  passwordConfirm: z.string().min(12).max(128),
}).superRefine((v, ctx) => {
  if (v.password !== v.passwordConfirm) {
    ctx.addIssue({ code: "custom", path: ["passwordConfirm"], message: "Passwords do not match." });
  }
});

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid password.", 422, parsed.error.flatten());
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) return fail("VALIDATION_ERROR", error.message, 400);
    return ok({ updated: true });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code, e.code === "FORBIDDEN" ? "Forbidden." : "Authentication required.", e.code === "FORBIDDEN" ? 403 : 401);
    return serverError(e);
  }
}
