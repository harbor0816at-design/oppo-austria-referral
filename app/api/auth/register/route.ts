import { cookies } from "next/headers";
import { registerSchema } from "@/lib/validation/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { callReferralEdgeWithToken } from "@/lib/supabase/edge";
import { ok, fail, serverError } from "@/lib/http";
import { env } from "@/lib/env";
import { REFERRAL_CODE_COOKIE, REFERRAL_SESSION_COOKIE } from "@/lib/referral/cookies";

export async function POST(req:Request){try{
  const parsed=registerSchema.safeParse(await req.json());if(!parsed.success)return fail("VALIDATION_ERROR","Invalid registration data.",422,parsed.error.flatten());const v=parsed.data;const supabase=await createServerSupabase();
  const metadata={first_name:v.firstName,last_name:v.lastName,phone:v.phone,country:v.country,language:v.language,referral_terms_granted:true,referral_terms_version:"v1"};
  const auth=v.mode==="magic_link"?await supabase.auth.signInWithOtp({email:v.email,options:{emailRedirectTo:`${env.siteUrl}/auth/confirm?next=/my-referrals`,data:metadata}}):await supabase.auth.signUp({email:v.email,password:v.password!,options:{emailRedirectTo:`${env.siteUrl}/auth/confirm?next=/my-referrals`,data:metadata}});
  if(auth.error)return fail("VALIDATION_ERROR",auth.error.message,400);const user="user" in auth.data?auth.data.user:null;const session=auth.data.session;
  if(user&&session?.access_token){const store=await cookies();await callReferralEdgeWithToken(session.access_token,"log_consent",{consentType:"referral_terms",consentVersion:"v1",granted:true});await callReferralEdgeWithToken(session.access_token,"attribute_registration",{sessionId:store.get(REFERRAL_SESSION_COOKIE)?.value,referralCode:store.get(REFERRAL_CODE_COOKIE)?.value})}
  return ok({mode:v.mode,userId:user?.id??null,confirmationRequired:!session},201)
}catch(e){return serverError(e)}}
