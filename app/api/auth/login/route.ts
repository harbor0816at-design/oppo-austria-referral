import { loginSchema } from "@/lib/validation/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { ok, fail, serverError } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const parsed = loginSchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid credentials payload.", 422, parsed.error.flatten());
    }

    const supabase = await createServerSupabase();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);

    if (error) {
      const code = String((error as { code?: string }).code || "");
      const message = String(error.message || "").toLowerCase();

      if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
        return fail(
          "UNAUTHORIZED",
          "EMAIL_NOT_CONFIRMED",
          403,
        );
      }

      return fail("UNAUTHORIZED", "INVALID_EMAIL_OR_PASSWORD", 401);
    }

    return ok({
      userId: data.user.id,
      role: data.user.app_metadata?.role ?? "member",
    });
  } catch (e) {
    return serverError(e);
  }
}
