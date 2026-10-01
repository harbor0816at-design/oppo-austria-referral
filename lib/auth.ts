import type { User } from "@supabase/supabase-js";
import { createServerSupabase } from "@/lib/supabase/server";
export async function requireUser(): Promise<User> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new AuthError("UNAUTHORIZED");
  return data.user;
}
export async function requireAdmin(): Promise<User> {
  const user = await requireUser();
  if (user.app_metadata?.role !== "admin") throw new AuthError("FORBIDDEN");
  return user;
}
export class AuthError extends Error {
  constructor(public code: "UNAUTHORIZED" | "FORBIDDEN") { super(code); }
}
