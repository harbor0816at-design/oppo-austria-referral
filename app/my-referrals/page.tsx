import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import MemberClient from "./MemberClient";

export default async function MyReferralsPage() {
  const user = await requireUser().catch(() => redirect("/portal/index.html"));
  const role = String(user.app_metadata?.role || "");
  if (["admin", "super_admin"].includes(role)) redirect("/admin");
  if (role === "employee") redirect("/staff");
  return <MemberClient />;
}
