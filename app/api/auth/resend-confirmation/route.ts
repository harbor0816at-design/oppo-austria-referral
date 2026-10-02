import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { ok, fail, serverError } from "@/lib/http";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid email.", 422);

    const origin = new URL(req.url).origin;
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: parsed.data.email,
      options: {
        emailRedirectTo: `${origin}/auth/confirm?next=/my-referrals`,
      },
    });

    if (error) return fail("VALIDATION_ERROR", error.message, 400);
    return ok({ sent: true });
  } catch (e) {
    return serverError(e);
  }
}
