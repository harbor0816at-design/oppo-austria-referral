import type { EmailOtpType } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { callReferralEdgeWithToken } from "@/lib/supabase/edge";
import { REFERRAL_CODE_COOKIE, REFERRAL_SESSION_COOKIE } from "@/lib/referral/cookies";

const CANONICAL_ORIGIN = "https://www.opporfriend.com";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;

  const requestedNext = url.searchParams.get("next") ?? "/portal/index.html";
  let next =
    requestedNext.startsWith("/") && !requestedNext.startsWith("//")
      ? requestedNext
      : "/portal/index.html";

  const supabase = await createServerSupabase();

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (error) {
      return NextResponse.redirect(
        new URL("/portal/index.html?auth=error", CANONICAL_ORIGIN),
      );
    }
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      return NextResponse.redirect(
        new URL("/portal/index.html?auth=error", CANONICAL_ORIGIN),
      );
    }
  } else {
    return NextResponse.redirect(
      new URL("/portal/index.html?auth=missing_token", CANONICAL_ORIGIN),
    );
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session?.access_token) {
    const store = await cookies();
    const user = session.user;

    if (requestedNext === "/staff" && user.app_metadata?.role === "admin") {
      next = "/admin";
    }

    if (user.user_metadata?.referral_terms_granted === true) {
      await callReferralEdgeWithToken(session.access_token, "log_consent", {
        consentType: "referral_terms",
        consentVersion: String(
          user.user_metadata?.referral_terms_version || "v1",
        ),
        granted: true,
      }).catch(() => undefined);
    }

    await callReferralEdgeWithToken(
      session.access_token,
      "attribute_registration",
      {
        sessionId: store.get(REFERRAL_SESSION_COOKIE)?.value,
        referralCode: store.get(REFERRAL_CODE_COOKIE)?.value,
      },
    ).catch(() => undefined);
  }

  return NextResponse.redirect(new URL(next, CANONICAL_ORIGIN));
}
