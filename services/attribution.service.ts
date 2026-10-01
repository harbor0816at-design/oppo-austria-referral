import { callReferralEdge } from "@/lib/supabase/edge";
export async function attributeRegistration(params: { userId?: string; email?: string; sessionId?: string; referralCode?: string }) {
  return callReferralEdge<any>("attribute_registration", { sessionId: params.sessionId, referralCode: params.referralCode });
}
