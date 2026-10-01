import { createServerSupabase } from "@/lib/supabase/server";
import { ok, serverError } from "@/lib/http";
export async function GET(){try{const db=await createServerSupabase();const r=await db.from("referral_tiers").select("id,name,minimum_referrals,reward_description,sort_order").eq("active",true).order("sort_order");if(r.error)throw r.error;return ok(r.data)}catch(e){return serverError(e)}}
