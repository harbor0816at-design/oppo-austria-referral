"use client";

import { useCallback, useEffect, useState } from "react";

type Referral = {
  id: string;
  referral_code: string;
  referred_email: string | null;
  status: string;
  created_at: string;
  registered_at: string | null;
  qualified_at: string | null;
  rejection_reason: string | null;
};

type UserRow = { id: string; email: string; status: string; created_at: string };
type Reward = { id: string; reward_amount: number; currency: string; status: string };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const body = await res.json();
  if (!res.ok || !body.success) throw new Error(body?.error?.message || "Request failed");
  return body.data as T;
}

export default function AdminClient() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [r, u, w] = await Promise.all([
        request<Referral[]>("/api/admin/referrals"),
        request<UserRow[]>("/api/admin/users"),
        request<Reward[]>("/api/admin/rewards"),
      ]);
      setReferrals(r);
      setUsers(u);
      setRewards(w);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Daten konnten nicht geladen werden.");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function updateReferral(id: string, status: "qualified" | "rejected") {
    setBusy(id + status);
    setError("");
    try {
      await request("/api/admin/referrals/" + id, {
        method: "PATCH",
        body: JSON.stringify({ status, ...(status === "rejected" ? { reason: "admin_rejected" } : {}) }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update fehlgeschlagen.");
    } finally {
      setBusy(null);
    }
  }

  const reviewable = referrals.filter(r => ["registered", "pending"].includes(r.status)).length;
  const qualified = referrals.filter(r => ["qualified", "rewarded"].includes(r.status)).length;
  const rewardTotal = rewards
    .filter(r => !["cancelled", "expired"].includes(r.status))
    .reduce((sum, r) => sum + Number(r.reward_amount || 0), 0);

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 }}>
        {[
          ["Nutzer", users.length],
          ["Zu prüfen", reviewable],
          ["Qualifiziert", qualified],
          ["Rewards", "€" + rewardTotal.toFixed(2)],
        ].map(([label, value]) => (
          <div key={String(label)} style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 16, padding: 18 }}>
            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>{label}</div>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </section>

      {error ? <div style={{ padding: 12, background: "#fff1f2", color: "#b91c1c", borderRadius: 10 }}>{error}</div> : null}

      <section style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 18, overflow: "hidden" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontWeight: 700 }}>Referral Prüfung</div>
            <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>Qualifizieren erzeugt automatisch die konfigurierten Rewards für beide Seiten.</div>
          </div>
          <button onClick={() => void load()} style={{ border: "1px solid #d1d5db", background: "#fff", borderRadius: 10, padding: "8px 12px", cursor: "pointer" }}>Aktualisieren</button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: "left", background: "#f9fafb", color: "#6b7280" }}>
                <th style={{ padding: 12 }}>E-Mail</th>
                <th style={{ padding: 12 }}>Code</th>
                <th style={{ padding: 12 }}>Status</th>
                <th style={{ padding: 12 }}>Erstellt</th>
                <th style={{ padding: 12 }}>Aktion</th>
              </tr>
            </thead>
            <tbody>
              {referrals.map(r => (
                <tr key={r.id} style={{ borderTop: "1px solid #f0f1f3" }}>
                  <td style={{ padding: 12 }}>{r.referred_email || "—"}</td>
                  <td style={{ padding: 12, fontFamily: "monospace" }}>{r.referral_code}</td>
                  <td style={{ padding: 12 }}>{r.status}</td>
                  <td style={{ padding: 12 }}>{new Date(r.created_at).toLocaleString("de-AT")}</td>
                  <td style={{ padding: 12 }}>
                    {["registered", "pending"].includes(r.status) ? (
                      <div style={{ display: "flex", gap: 8 }}>
                        <button disabled={busy !== null} onClick={() => void updateReferral(r.id, "qualified")} style={{ border: 0, background: "#008254", color: "#fff", borderRadius: 9, padding: "7px 10px", cursor: "pointer" }}>
                          Qualifizieren
                        </button>
                        <button disabled={busy !== null} onClick={() => void updateReferral(r.id, "rejected")} style={{ border: "1px solid #d1d5db", background: "#fff", borderRadius: 9, padding: "7px 10px", cursor: "pointer" }}>
                          Ablehnen
                        </button>
                      </div>
                    ) : "—"}
                  </td>
                </tr>
              ))}
              {!referrals.length ? <tr><td colSpan={5} style={{ padding: 24, color: "#6b7280" }}>Noch keine Referral-Daten.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
