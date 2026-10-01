import { env } from "@/lib/env";
import { callReferralEdge, callReferralEdgePublic } from "@/lib/supabase/edge";

function absolute(path: string) {
  return new URL(path, `${env.siteUrl.replace(/\/$/, "")}/`).toString();
}

export async function getOrCreateReferrer(_userId?: string) {
  const r = await callReferralEdge<{ referralCode: string; referralPath: string }>("get_or_create_referrer");
  return { referral_code: r.referralCode, referral_link: absolute(r.referralPath) };
}

export async function getReferralDashboard(_userId?: string) {
  const d = await callReferralEdge<{
    referralCode: string; referralPath: string; successfulReferrals: number; pendingReferrals: number;
    currentTier: string; availableReward: number; totalRewardAmount: number;
  }>("dashboard");
  return { ...d, referralLink: absolute(d.referralPath) };
}

export async function listOwnReferrals(_userId?: string, status?: string) {
  return callReferralEdge<any[]>("list_referrals", status ? { status } : {});
}

export async function trackReferralClick(code: string, sessionId: string, meta: { source?: string; utm_source?: string; utm_medium?: string; utm_campaign?: string }) {
  const r = await callReferralEdgePublic<{ referralCode: string } | null>("track_click", { code, sessionId, ...meta });
  return r ? { referral_code: r.referralCode } : null;
}
