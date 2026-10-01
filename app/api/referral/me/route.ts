import { requireUser, AuthError } from "@/lib/auth"; import { getReferralDashboard } from "@/services/referral.service"; import { ok, fail, serverError } from "@/lib/http";
export async function GET(){try{const u=await requireUser();return ok(await getReferralDashboard(u.id));}catch(e){if(e instanceof AuthError)return fail(e.code,"Authentication required.",401);return serverError(e)}}
