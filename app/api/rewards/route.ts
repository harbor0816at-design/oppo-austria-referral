import { requireUser, AuthError } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { ok, fail, serverError } from "@/lib/http";
export async function GET(){try{const u=await requireUser();const db=await createServerSupabase();const r=await db.from("rewards").select("id,referral_id,reward_type,reward_amount,currency,status,created_at,approved_at,redeemed_at,expires_at").eq("user_id",u.id).order("created_at",{ascending:false});if(r.error)throw r.error;return ok(r.data)}catch(e){if(e instanceof AuthError)return fail(e.code,"Authentication required.",401);return serverError(e)}}
