import { requireStaff, AuthError } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { ok, fail, serverError } from "@/lib/http";
import { mapOrderRow, parseCsv, scoreOrderMatch, type CrmCustomer } from "@/lib/crm";

function parseOrderDate(v: string | null) {
  if (!v) return null;
  const direct = Date.parse(v);
  if (!Number.isNaN(direct)) return new Date(direct).toISOString();
  const m = v.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (m) return new Date(Date.UTC(Number(m[3]),Number(m[2])-1,Number(m[1]),12)).toISOString();
  return null;
}

export async function POST(req: Request) {
  try {
    const user = await requireStaff();
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) return fail("VALIDATION_ERROR","CSV file is required.",400);
    if (!/\.(csv|txt|tsv)$/i.test(file.name)) {
      return fail("VALIDATION_ERROR","V1 currently accepts CSV/TSV. In Excel use Save As → CSV UTF-8, then upload.",400);
    }
    const rows = parseCsv(await file.text()).map(mapOrderRow).filter(x => x.order_number);
    if (!rows.length) return fail("VALIDATION_ERROR","No order rows with an order number were found.",400);

    const supabase = await createServerSupabase();
    const { data: importRow, error: importError } = await supabase.from("crm_order_imports").insert({
      file_name:file.name,row_count:rows.length,status:"uploaded",uploaded_by:user.id
    }).select("*").single();
    if (importError) throw importError;

    const { data: customers, error: customerError } = await supabase.from("crm_customers").select("*");
    if (customerError) throw customerError;
    const allCustomers = (customers || []) as CrmCustomer[];

    let matched=0, possible=0, unmatched=0;
    const results:any[] = [];

    for (const row of rows) {
      let best: { customer: CrmCustomer | null; score: number; reason: string } = { customer:null,score:0,reason:"none" };
      for (const customer of allCustomers) {
        const s = scoreOrderMatch(customer,{email:row.email,phone:row.phone,customer_name:row.customer_name});
        if (s.score > best.score) best = { customer, ...s };
      }
      const matchStatus = best.score >= 95 ? "matched" : best.score >= 68 ? "possible" : "unmatched";
      if (matchStatus === "matched") matched++; else if (matchStatus === "possible") possible++; else unmatched++;

      const payload = {
        import_id: importRow.id,
        order_number: row.order_number,
        order_date: parseOrderDate(row.order_date),
        customer_name: row.customer_name,
        email: row.email,
        phone: row.phone,
        phone_norm: row.phone_norm,
        product_name: row.product_name,
        quantity: row.quantity,
        gross_amount: row.gross_amount,
        net_amount: row.net_amount,
        currency: row.currency,
        country: row.country,
        status: row.status,
        customer_id: matchStatus === "matched" ? best.customer?.id || null : null,
        match_status: matchStatus,
        match_score: best.score,
        match_reason: best.reason,
        raw_data: row.raw_data,
        updated_at:new Date().toISOString(),
      };

      const { data: saved, error: orderError } = await supabase
        .from("crm_orders")
        .upsert(payload,{onConflict:"order_number"})
        .select("*")
        .single();
      if (orderError) throw orderError;
      results.push(saved);

      if (matchStatus === "matched" && best.customer) {
        const won = ["purchased","owner","referral_eligible","advocate"].includes(best.customer.state);
        if (!won) {
          await supabase.from("crm_customers").update({
            state:"purchased",
            next_action:"Owner check-in",
            next_action_due:new Date(Date.now()+3*86400000).toISOString(),
            updated_at:new Date().toISOString()
          }).eq("id",best.customer.id);
          const { data: existing } = await supabase.from("crm_actions")
            .select("id").eq("customer_id",best.customer.id).eq("status","open").eq("action_type","owner_check_in").limit(1);
          if (!existing?.length) {
            await supabase.from("crm_actions").insert({
              customer_id:best.customer.id,
              action_type:"owner_check_in",
              title:"Owner check-in after purchase",
              due_at:new Date(Date.now()+3*86400000).toISOString(),
              priority:"normal",
              assigned_to:user.id,
              created_by:user.id,
              metadata:{order_number:row.order_number}
            });
          }
          await supabase.from("crm_activities").insert({
            customer_id:best.customer.id,
            activity_type:"order",
            summary:`Order matched: ${row.order_number}${row.product_name ? ` · ${row.product_name}` : ""}`,
            metadata:{order_number:row.order_number,gross_amount:row.gross_amount,currency:row.currency},
            created_by:user.id
          });
        }
      }
    }

    const { error: updateError } = await supabase.from("crm_order_imports").update({
      matched_count:matched,possible_count:possible,unmatched_count:unmatched,status:"processed"
    }).eq("id",importRow.id);
    if (updateError) throw updateError;
    return ok({import_id:importRow.id,row_count:rows.length,matched,possible,unmatched,orders:results},201);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code,e.message,e.code === "FORBIDDEN" ? 403 : 401);
    return serverError(e);
  }
}
