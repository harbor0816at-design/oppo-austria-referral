import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import AgreementClient from "./AgreementClient";

export default async function AgreementPage() {
  const user = await requireUser().catch(() => redirect("/portal/index.html"));
  const role = String(user.app_metadata?.role || "");
  if (["admin","super_admin"].includes(role)) redirect("/admin");
  if (role === "employee") redirect("/staff");
  return <AgreementClient />;
}
