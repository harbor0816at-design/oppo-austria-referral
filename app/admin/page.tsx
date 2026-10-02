import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const user = await requireAdmin().catch(() => redirect("/portal/index.html?staff=1"));
  return <AdminClient adminEmail={user.email || ""} adminRole={String(user.app_metadata?.role || "admin")} />;
}
