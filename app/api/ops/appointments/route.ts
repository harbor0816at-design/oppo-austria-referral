import { requireStaff, AuthError } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { ok, fail, serverError } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const user = await requireStaff();
    const body = await req.json();
    if (!body.customer_id || !body.appointment_at) return fail("VALIDATION_ERROR","customer_id and appointment_at are required.",400);
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.from("crm_appointments").insert({
      customer_id: body.customer_id,
      appointment_at: body.appointment_at,
      purpose: body.purpose || null,
      notes: body.notes || null,
      created_by: user.id,
    }).select("*").single();
    if (error) throw error;
    await supabase.from("crm_customers").update({
      state:"showroom",
      next_action:"Showroom appointment",
      next_action_due: body.appointment_at,
      updated_at:new Date().toISOString()
    }).eq("id",body.customer_id);
    return ok(data,201);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code,e.message,e.code === "FORBIDDEN" ? 403 : 401);
    return serverError(e);
  }
}

export async function PATCH(req: Request) {
  try {
    const user = await requireStaff();
    const body = await req.json();
    if (!body.id) return fail("VALIDATION_ERROR","Appointment id is required.",400);
    const supabase = await createServerSupabase();
    const patch: Record<string,unknown> = { updated_at:new Date().toISOString() };
    for (const k of ["status","outcome","notes","appointment_at","purpose"]) if (k in body) patch[k] = body[k] || null;
    const { data, error } = await supabase.from("crm_appointments").update(patch).eq("id",body.id).select("*").single();
    if (error) throw error;
    if (body.status === "attended") {
      await supabase.from("crm_activities").insert({
        customer_id:data.customer_id,
        activity_type:"showroom",
        summary:`Showroom attended${body.outcome ? `: ${body.outcome}` : ""}`,
        created_by:user.id
      });
    }
    return ok(data);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code,e.message,e.code === "FORBIDDEN" ? 403 : 401);
    return serverError(e);
  }
}
