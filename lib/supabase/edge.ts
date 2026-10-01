import { createServerSupabase } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export class ReferralEdgeError extends Error {
  constructor(public code: string, public status: number, message?: string) {
    super(message ?? code);
  }
}

type Envelope<T> = { success: true; data: T } | { success: false; error?: { code?: string; message?: string } };

async function invoke<T>(action: string, payload: Record<string, unknown>, accessToken?: string): Promise<T> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    apikey: env.publishableKey,
  };
  if (accessToken) headers.authorization = `Bearer ${accessToken}`;

  const response = await fetch(`${env.supabaseUrl}/functions/v1/referral-backend`, {
    method: "POST",
    headers,
    body: JSON.stringify({ action, payload }),
    cache: "no-store",
  });
  const body = (await response.json().catch(() => ({}))) as Envelope<T>;
  if (!response.ok || !body || body.success !== true) {
    const err = body && "error" in body ? body.error : undefined;
    throw new ReferralEdgeError(err?.code ?? "EDGE_FUNCTION_ERROR", response.status, err?.message);
  }
  return body.data;
}

export async function callReferralEdge<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) throw new ReferralEdgeError("UNAUTHORIZED", 401);
  return invoke<T>(action, payload, data.session.access_token);
}

export async function callReferralEdgeWithToken<T>(accessToken: string, action: string, payload: Record<string, unknown> = {}): Promise<T> {
  return invoke<T>(action, payload, accessToken);
}

export async function callReferralEdgePublic<T>(action: string, payload: Record<string, unknown> = {}): Promise<T> {
  return invoke<T>(action, payload);
}
