import { createServerSupabase } from "@/lib/supabase/server";
import { ok, serverError } from "@/lib/http";
export async function POST() { try { const s = await createServerSupabase(); await s.auth.signOut(); return ok({ loggedOut: true }); } catch(e) { return serverError(e); } }
