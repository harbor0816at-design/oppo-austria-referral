import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth";

export default async function StaffPage() {
  const user = await requireStaff().catch(() => redirect("/portal/index.html?staff=1"));
  if (user.app_metadata?.role === "admin") redirect("/admin");
  return (
    <main style={{ minHeight: "100vh", background: "#f6f7f9", padding: 32, fontFamily: "Arial, sans-serif" }}>
      <div style={{ maxWidth: 720, margin: "80px auto", background: "#fff", border: "1px solid #e5e7eb", borderRadius: 20, padding: 28 }}>
        <div style={{ fontSize: 12, color: "#008254", fontWeight: 700 }}>OPPO AUSTRIA</div>
        <h1 style={{ fontSize: 26, margin: "8px 0 12px" }}>Mitarbeiterbereich</h1>
        <p style={{ color: "#6b7280", lineHeight: 1.6 }}>
          Angemeldet als {user.email}. Ihr Mitarbeiterkonto ist aktiv. Administrative Freigaben sind ausschließlich für Konten mit der Rolle admin verfügbar.
        </p>
        <a href="/portal/index.html" style={{ display: "inline-block", marginTop: 18, color: "#008254", fontWeight: 700 }}>Zum Referral Portal</a>
      </div>
    </main>
  );
}
