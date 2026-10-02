import { z } from "zod";
import { createServerSupabase } from "@/lib/supabase/server";
import { ok, fail, serverError } from "@/lib/http";

const schema = z.object({
  email: z.string().email(),
  staff: z.boolean().optional().default(false),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid email.", 422, parsed.error.flatten());
    }

    const requestUrl = new URL(req.url);
    const origin = requestUrl.origin;
    const next = parsed.data.staff ? "/staff" : "/my-referrals";

    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${origin}/auth/confirm?next=${next}`,
      },
    });

    if (error) return fail("UNAUTHORIZED", error.message, 400);
    return ok({ sent: true });
  } catch (e) {
    return serverError(e);
  }
}
