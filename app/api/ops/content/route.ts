import { requireStaff, AuthError } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { ok, fail, serverError } from "@/lib/http";

export async function POST(req: Request) {
  try {
    const user = await requireStaff();
    const body = await req.json();
    if (!body.content_code || !body.title || !body.category) return fail("VALIDATION_ERROR","content_code, title and category are required.",400);
    const supabase = await createServerSupabase();
    const { data, error } = await supabase.from("crm_content_assets").insert({
      content_code: String(body.content_code).trim().toUpperCase(),
      title: String(body.title).trim(),
      category: body.category,
      purchase_barrier: body.purchase_barrier || null,
      channel: body.channel || "whatsapp",
      language: body.language || "de",
      body: body.body || null,
      asset_url: body.asset_url || null,
      active: body.active !== false,
      sort_order: Number(body.sort_order || 0),
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
    await requireStaff();
    const body = await req.json();
    if (!body.id) return fail("VALIDATION_ERROR","Content id is required.",400);
    const supabase = await createServerSupabase();
    const patch: Record<string,unknown> = { updated_at: new Date().toISOString() };
    for (const k of ["content_code","title","category","purchase_barrier","channel","language","body","asset_url","active","sort_order"]) {
      if (k in body) patch[k] = body[k] === "" ? null : body[k];
    }
    const { data, error } = await supabase.from("crm_content_assets").update(patch).eq("id",body.id).select("*").single();
    if (error) throw error;
    return ok(data);
  } catch (e) {
    if (e instanceof AuthError) return fail(e.code,e.message,e.code === "FORBIDDEN" ? 403 : 401);
    return serverError(e);
  }
}
