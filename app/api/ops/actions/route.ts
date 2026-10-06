import { requireStaff, AuthError } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { ok, fail, serverError } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const user = await requireStaff();
    const body = await req.json();
    if (!body.customer_id || !body.title || !body.due_at) return fail("VALIDATION_ERROR","customer_id, title and due_at are required.",400);
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.from("crm_actions").insert({
      customer_id: body.customer_id,
      action_type: body.action_type || "follow_up",
      title: body.title,
      due_at: body.due_at,
      priority: body.priority || "normal",
      assigned_to: body.assigned_to || user.id,
      metadata: body.metadata || {},
      created_by: user.id,
    }).select("*").single();
    if (error) throw error;
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
    if (!body.id) return fail("VALIDATION_ERROR","Action id is required.",400);
    const supabase = await createServerSupabase();
    const patch: Record<string,unknown> = { updated_at: new Date().toISOString() };
    if (body.status) {
      patch.status = body.status;
      if (body.status === "done") patch.completed_at = new Date().toISOString();
    }
    if ("outcome" in body) patch.outcome = body.outcome || null;
    if ("due_at" in body) patch.due_at = body.due_at;
    const { data, error } = await supabase.from("crm_actions").update(patch).eq("id",body.id).select("*").single();
    if (error) throw error;
    if (body.status === "done") {
      await supabase.from("crm_activities").insert({
        customer_id: data.customer_id,
        activity_type: "note",
        summary: `Completed action: ${data.title}${body.outcome ? ` — ${body.outcome}` : ""}`,
        created_by: user.id
      });
    }
    return ok(data);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code,e.message,e.code === "FORBIDDEN" ? 403 : 401);
    return serverError(e);
  }
}
