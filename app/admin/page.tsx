import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import AdminClient from "./AdminClient";

export default async function AdminPage() {
  const user = await requireAdmin().catch(() => redirect("/portal/index.html?staff=1"));
  return (
    <main style={{ minHeight: "100vh", background: "#f6f7f9", color: "#121316", fontFamily: "Arial, sans-serif" }}>
      <header style={{ background: "#fff", borderBottom: "1px solid #e5e7eb", padding: "18px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 12, color: "#008254", fontWeight: 700 }}>OPPO AUSTRIA</div>
          <h1 style={{ margin: "4px 0 0", fontSize: 24 }}>Referral Admin</h1>
        </div>
        <div style={{ textAlign: "right", fontSize: 12, color: "#6b7280" }}>
          <div style={{ color: "#121316", fontWeight: 600 }}>{user.email}</div>
          <div>Administrator</div>
        </div>
      </header>
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: 28 }}>
        <AdminClient />
      </div>
    </main>
  );
}
