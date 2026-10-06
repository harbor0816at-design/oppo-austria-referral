import { requireStaff, AuthError } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { ok, fail, serverError } from "@/lib/http";

export async function GET() {
  try {
    await requireStaff();
    const supabase = await createServerSupabase();
    const now = new Date().toISOString();
    const [
      customers, actions, content, appointments, orders, products, referrers
    ] = await Promise.all([
      supabase.from("crm_customers").select("*").order("updated_at", { ascending: false }),
      supabase.from("crm_actions").select("*").order("due_at", { ascending: true }),
      supabase.from("crm_content_assets").select("*").order("sort_order", { ascending: true }),
      supabase.from("crm_appointments").select("*").order("appointment_at", { ascending: true }),
      supabase.from("crm_orders").select("*").order("order_date", { ascending: false }).limit(500),
      supabase.from("referral_products").select("id,model_name,variant,active").eq("active", true).order("sort_order"),
      supabase.from("referrers").select("id,user_id,referral_code,successful_referrals,total_reward_amount")
    ]);
    for (const r of [customers,actions,content,appointments,orders,products,referrers]) if (r.error) throw r.error;

    const c = customers.data || [];
    const a = actions.data || [];
    const o = orders.data || [];
    const wonStates = new Set(["purchased","owner","referral_eligible","advocate"]);
    const qualifiedStates = new Set(["qualified","decision","high_intent","showroom","purchased","owner","referral_eligible","advocate"]);
    const dashboard = {
      customers: c.length,
      hot: c.filter(x => x.temperature === "hot" && !wonStates.has(x.state)).length,
      dueToday: a.filter(x => x.status === "open" && x.due_at <= now).length,
      qualified: c.filter(x => qualifiedStates.has(x.state)).length,
      purchased: c.filter(x => wonStates.has(x.state)).length,
      advocates: c.filter(x => x.state === "advocate").length,
      unmatchedOrders: o.filter(x => x.match_status === "unmatched" || x.match_status === "possible").length,
      leadToPurchase: c.length ? Math.round(c.filter(x => wonStates.has(x.state)).length / c.length * 1000) / 10 : 0,
    };

    return ok({
      dashboard,
      customers: c,
      actions: a,
      content: content.data || [],
      appointments: appointments.data || [],
      orders: o,
      products: products.data || [],
      referrers: referrers.data || [],
    });
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code, e.message, e.code === "FORBIDDEN" ? 403 : 401);
    return serverError(e);
  }
}
