import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { callReferralEdgeWithToken } from "@/lib/supabase/edge";
import { env } from "@/lib/env";
import { REFERRAL_CODE_COOKIE, REFERRAL_SESSION_COOKIE } from "@/lib/referral/cookies";

export async function GET(request:Request){
  const url=new URL(request.url),code=url.searchParams.get("code"),requestedNext=url.searchParams.get("next")??"/my-referrals";const next=requestedNext.startsWith("/")&&!requestedNext.startsWith("//")?requestedNext:"/my-referrals";const supabase=await createServerSupabase();
  if(code){const {error}=await supabase.auth.exchangeCodeForSession(code);if(error)return NextResponse.redirect(new URL("/?auth=error",env.siteUrl))}
  const {data}=await supabase.auth.getSession();const session=data.session;
  if(session?.access_token){const store=await cookies();const user=session.user;if(user.user_metadata?.referral_terms_granted===true){await callReferralEdgeWithToken(session.access_token,"log_consent",{consentType:"referral_terms",consentVersion:String(user.user_metadata?.referral_terms_version||"v1"),granted:true}).catch(()=>undefined)}await callReferralEdgeWithToken(session.access_token,"attribute_registration",{sessionId:store.get(REFERRAL_SESSION_COOKIE)?.value,referralCode:store.get(REFERRAL_CODE_COOKIE)?.value}).catch(()=>undefined)}
  return NextResponse.redirect(new URL(next,env.siteUrl));
}
