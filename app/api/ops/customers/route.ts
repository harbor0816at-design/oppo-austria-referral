import { requireStaff, AuthError } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { ok, fail, serverError } from "@/lib/http";
import { deriveTemperature, normalizeEmail, normalizePhone } from "@/lib/crm";

export async function POST(req: Request) {
  try {
    const user = await requireStaff();
    const body = await req.json();
    const fullName = String(body.full_name || "").trim();
    if (!fullName) return fail("VALIDATION_ERROR","Customer name is required.",400);

    const score = Math.max(0, Math.min(100, Number(body.lead_score || 0)));
    const supabase = await createServerSupabase();
    const payload = {
      full_name: fullName,
      whatsapp: String(body.whatsapp || "").trim() || null,
      phone_norm: normalizePhone(body.whatsapp || body.phone) || null,
      email: normalizeEmail(body.email) || null,
      source: String(body.source || "whatsapp"),
      current_device: String(body.current_device || "").trim() || null,
      product_interest_id: body.product_interest_id || null,
      product_interest_text: String(body.product_interest_text || "").trim() || null,
      primary_need: String(body.primary_need || "").trim() || null,
      purchase_barrier: String(body.purchase_barrier || "").trim() || null,
      purchase_horizon: String(body.purchase_horizon || "").trim() || null,
      lead_score: score,
      temperature: deriveTemperature(score),
      state: body.state || "new",
      advisor_user_id: user.id,
      next_action: String(body.next_action || "").trim() || null,
      next_action_due: body.next_action_due || null,
      marketing_consent: Boolean(body.marketing_consent),
      consent_source: body.marketing_consent ? String(body.consent_source || "manual") : null,
      consent_at: body.marketing_consent ? new Date().toISOString() : null,
      notes: String(body.notes || "").trim() || null,
      created_by: user.id,
    };
    const { data, error } = await supabase.from("crm_customers").insert(payload).select("*").single();
    if (error) throw error;
    if (payload.next_action && payload.next_action_due) {
      const { error: actionError } = await supabase.from("crm_actions").insert({
        customer_id: data.id,
        title: payload.next_action,
        due_at: payload.next_action_due,
        assigned_to: user.id,
        created_by: user.id,
        priority: score >= 70 ? "high" : "normal"
      });
      if (actionError) throw actionError;
    }
    return ok(data, 201);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code,e.message,e.code === "FORBIDDEN" ? 403 : 401);
    return serverError(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireStaff();
    const body = await req.json();
    if (!body.id) return fail("VALIDATION_ERROR","Customer id is required.",400);
    const supabase = await createServerSupabase();
    const { data: before, error: beforeError } = await supabase.from("crm_customers").select("*").eq("id",body.id).single();
    if (beforeError) throw beforeError;

    const patch: Record<string,unknown> = { updated_at: new Date().toISOString() };
    const allowed = [
      "full_name","whatsapp","email","source","current_device","product_interest_id","product_interest_text",
      "primary_need","purchase_barrier","purchase_horizon","lead_score","state","next_action","next_action_due",
      "satisfaction","marketing_consent","consent_source","consent_at","opted_out_at","notes","referrer_id"
    ];
    for (const k of allowed) if (k in body) patch[k] = body[k] === "" ? null : body[k];
    if ("whatsapp" in body) patch.phone_norm = normalizePhone(body.whatsapp) || null;
    if ("email" in body) patch.email = normalizeEmail(body.email) || null;
    if ("lead_score" in body) {
      const score = Math.max(0,Math.min(100,Number(body.lead_score || 0)));
      patch.lead_score = score;
      patch.temperature = deriveTemperature(score);
    }
    const { data, error } = await supabase.from("crm_customers").update(patch).eq("id",body.id).select("*").single();
    if (error) throw error;

    if (body.state && body.state !== before.state) {
      await supabase.from("crm_activities").insert({
        customer_id: body.id,
        activity_type: "status_change",
        summary: `State: ${before.state} → ${body.state}`,
        created_by: user.id
      });
    }
    return ok(data);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code,e.message,e.code === "FORBIDDEN" ? 403 : 401);
    return serverError(e);
  }
}
