import { requireStaff, AuthError } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { ok, fail, serverError } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const user = await requireStaff();
    const body = await req.json();
    if (!body.order_id || !body.customer_id) return fail("VALIDATION_ERROR","order_id and customer_id are required.",400);
    const supabase = await createServerSupabase();
    const { data: order, error } = await supabase.from("crm_orders").update({
      customer_id:body.customer_id,
      match_status:"manual",
      match_score:100,
      match_reason:"manual_review",
      updated_at:new Date().toISOString()
    }).eq("id",body.order_id).select("*").single();
    if (error) throw error;

    await supabase.from("crm_customers").update({
      state:"purchased",
      next_action:"Owner check-in",
      next_action_due:new Date(Date.now()+3*86400000).toISOString(),
      updated_at:new Date().toISOString()
    }).eq("id",body.customer_id);

    const { data: existing } = await supabase.from("crm_actions")
      .select("id").eq("customer_id",body.customer_id).eq("status","open").eq("action_type","owner_check_in").limit(1);
    if (!existing?.length) {
      await supabase.from("crm_actions").insert({
        customer_id:body.customer_id,
        action_type:"owner_check_in",
        title:"Owner check-in after purchase",
        due_at:new Date(Date.now()+3*86400000).toISOString(),
        assigned_to:user.id,
        created_by:user.id,
        metadata:{order_number:order.order_number}
      });
    }
    await supabase.from("crm_activities").insert({
      customer_id:body.customer_id,
      activity_type:"order",
      summary:`Manually matched order: ${order.order_number}`,
      metadata:{order_id:order.id},
      created_by:user.id
    });
    return ok(order);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code,e.message,e.code === "FORBIDDEN" ? 403 : 401);
    return serverError(e);
  }
}
