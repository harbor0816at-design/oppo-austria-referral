import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { callReferralEdge } from "@/lib/supabase/edge";
import MemberClient from "./MemberClient";

type AgreementGate = {
  required: boolean;
  agreement: { status: string } | null;
};

export default async function MyReferralsPage() {
  const user = await requireUser().catch(() => redirect("/portal/index.html"));
  const role = String(user.app_metadata?.role || "");
  if (["admin", "super_admin"].includes(role)) redirect("/admin");
  if (role === "employee") redirect("/staff");

  const gate = await callReferralEdge<AgreementGate>("member_agreement_status").catch(() => null);
  if (!gate || (gate.required && gate.agreement?.status !== "approved")) {
    redirect("/agreement");
  }

  return <MemberClient />;
}
