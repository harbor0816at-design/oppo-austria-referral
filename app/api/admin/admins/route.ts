import { requireSuperAdmin, AuthError } from "@/lib/auth";
import { callReferralEdge } from "@/lib/supabase/edge";
import { ok, fail, serverError } from "@/lib/http";
import { z } from "zod";

const createSchema = z.object({
  email: z.string().email(),
  password: z.string().min(12).max(128),
  passwordConfirm: z.string().min(12).max(128),
  firstName: z.string().trim().max(80).optional().default(""),
  lastName: z.string().trim().max(80).optional().default(""),
}).superRefine((v, ctx) => {
  if (v.password !== v.passwordConfirm) {
    ctx.addIssue({ code: "custom", path: ["passwordConfirm"], message: "Passwords do not match." });
  }
});

export async function GET() {
  try {
    await requireSuperAdmin();
    return ok(await callReferralEdge("admin_list_admins"));
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code, e.code === "FORBIDDEN" ? "Forbidden." : "Authentication required.", e.code === "FORBIDDEN" ? 403 : 401);
    return serverError(e);
  }
}

export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
    const parsed = createSchema.safeParse(await req.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid admin account data.", 422, parsed.error.flatten());
    return ok(await callReferralEdge("superadmin_create_admin", parsed.data), 201);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code, e.code === "FORBIDDEN" ? "Forbidden." : "Authentication required.", e.code === "FORBIDDEN" ? 403 : 401);
    return serverError(e);
  }
}
