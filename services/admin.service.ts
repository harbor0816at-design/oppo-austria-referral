import { callReferralEdge } from "@/lib/supabase/edge";

export async function updateReferralStatus(
  _adminUserId: string,
  referralId: string,
  nextStatus: string,
  reason?: string,
  productId?: string,
  orderNumber?: string,
) {
  return callReferralEdge<any>("admin_update_referral", {
    id: referralId,
    status: nextStatus,
    reason,
    productId,
    orderNumber,
  });
}
