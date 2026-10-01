import { requireUser, AuthError } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { ok, fail, serverError } from "@/lib/http";
export async function GET(){try{const u=await requireUser();const db=await createServerSupabase();const r=await db.from("profiles").select("id,email,first_name,last_name,phone,country,language,status,created_at").eq("id",u.id).single();if(r.error)throw r.error;return ok(r.data)}catch(e){if(e instanceof AuthError)return fail(e.code,e.code==="UNAUTHORIZED"?"Authentication required.":"Forbidden.",e.code==="UNAUTHORIZED"?401:403);return serverError(e)}}
