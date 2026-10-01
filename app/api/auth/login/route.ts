import { loginSchema } from "@/lib/validation/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { ok, fail, serverError } from "@/lib/http";
export async function POST(req: Request) {
  try {
    const parsed = loginSchema.safeParse(await req.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid credentials payload.", 422, parsed.error.flatten());
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) return fail("UNAUTHORIZED", "Invalid email or password.", 401);
    return ok({ userId: data.user.id });
  } catch (e) { return serverError(e); }
}
