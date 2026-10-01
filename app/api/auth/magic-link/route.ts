import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { ok, fail, serverError } from "@/lib/http";
import { env } from "@/lib/env";

const schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid email.", 422, parsed.error.flatten());
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${env.siteUrl}/auth/confirm?next=/my-referrals`,
      },
    });
    if (error) return fail("UNAUTHORIZED", error.message, 400);
    return ok({ sent: true });
  } catch (e) {
    return serverError(e);
  }
}
