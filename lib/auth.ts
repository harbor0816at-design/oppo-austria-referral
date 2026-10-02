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
  const role = String(user.app_metadata?.role || "");
  if (!["admin", "super_admin"].includes(role)) throw new AuthError("FORBIDDEN");
  return user;
}

export async function requireSuperAdmin(): Promise<User> {
  const user = await requireUser();
  if (String(user.app_metadata?.role || "") !== "super_admin") throw new AuthError("FORBIDDEN");
  return user;
}

export async function requireStaff(): Promise<User> {
  const user = await requireUser();
  const role = String(user.app_metadata?.role || "");
  if (!["admin", "super_admin", "employee"].includes(role)) throw new AuthError("FORBIDDEN");
  return user;
}

export class AuthError extends Error {
  constructor(public code: "UNAUTHORIZED" | "FORBIDDEN") { super(code); }
}
