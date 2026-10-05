import { z } from "zod";
import { requireAdmin, AuthError } from "@/lib/auth";
import { callReferralEdge } from "@/lib/supabase/edge";
import { ok, fail, serverError } from "@/lib/http";

export async function GET(){
  try{
    await requireAdmin();
    return ok(await callReferralEdge<any[]>("admin_list_users"));
  }catch(e){
    if(e instanceof AuthError)return fail(e.code,e.code==="FORBIDDEN"?"Admin access required.":"Authentication required.",e.code==="FORBIDDEN"?403:401);
    return serverError(e);
  }
}

const schema=z.object({
  id:z.string().uuid(),
  status:z.enum(["active","rejected"]),
});

export async function PATCH(req:Request){
  try{
    await requireAdmin();
    const parsed=schema.safeParse(await req.json());
    if(!parsed.success)return fail("VALIDATION_ERROR","Invalid user review.",422,parsed.error.flatten());
    return ok(await callReferralEdge("admin_update_user_review",parsed.data));
  }catch(e){
    if(e instanceof AuthError)return fail(e.code,e.code==="FORBIDDEN"?"Admin access required.":"Authentication required.",e.code==="FORBIDDEN"?403:401);
    const message=e instanceof Error?e.message:"Unable to review user.";
    return fail("VALIDATION_ERROR",message,400);
  }
}
