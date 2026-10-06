import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import OpsClient from "./OpsClient";

export default async function OpsPage() {
  const user = await requireStaff().catch(() => redirect("/portal/index.html?staff=1"));
  return (
    <OpsClient
      staffEmail={user.email || ""}
      staffRole={String(user.app_metadata?.role || "employee")}
    />
  );
}
