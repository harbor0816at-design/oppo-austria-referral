import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { trackReferralClick } from "@/services/referral.service";
import { REFERRAL_CODE_COOKIE, REFERRAL_SESSION_COOKIE } from "@/lib/referral/cookies";
export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params; const url = new URL(req.url); const session = randomUUID();
  const tracked = await trackReferralClick(code, session, { source: url.searchParams.get("source") ?? "referral_link", utm_source: url.searchParams.get("utm_source") ?? undefined, utm_medium: url.searchParams.get("utm_medium") ?? undefined, utm_campaign: url.searchParams.get("utm_campaign") ?? undefined });
  const target = new URL("/", env.siteUrl); if (!tracked) { target.searchParams.set("referral", "invalid"); return NextResponse.redirect(target); }
  target.searchParams.set("ref", tracked.referral_code);
  const res = NextResponse.redirect(target); const maxAge = env.referralCookieDays * 86400;
  res.cookies.set(REFERRAL_CODE_COOKIE, tracked.referral_code, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge });
  res.cookies.set(REFERRAL_SESSION_COOKIE, session, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge });
  return res;
}
