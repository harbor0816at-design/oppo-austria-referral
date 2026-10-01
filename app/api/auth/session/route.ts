import { requireUser, AuthError } from "@/lib/auth";
import { ok, fail, serverError } from "@/lib/http";

export async function GET() {
  try {
    const user = await requireUser();
    return ok({
      userId: user.id,
      email: user.email ?? null,
      role: user.app_metadata?.role ?? "member",
    });
  } catch (e) {
    if (e instanceof AuthError) return fail("UNAUTHORIZED", "Authentication required.", 401);
    return serverError(e);
  }
}
