import { requireUser } from "@/lib/auth";
import { callReferralEdge } from "@/lib/supabase/edge";

type AgreementStatus = {
  template: {
    version: string;
    title_de: string; title_en: string; title_zh: string;
    content_de: string; content_en: string; content_zh: string;
  } | null;
};

function esc(v: string) {
  return v.replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m] || m));
}

export async function GET(req: Request) {
  const user = await requireUser();
  const url = new URL(req.url);
  const lang = ["de","en","zh"].includes(url.searchParams.get("lang") || "") ? (url.searchParams.get("lang") as "de"|"en"|"zh") : "de";
  const s = await callReferralEdge<AgreementStatus>("member_agreement_status");
  if (!s.template) return new Response("No active agreement template.",{status:404});

  const title = lang==="zh"?s.template.title_zh:lang==="en"?s.template.title_en:s.template.title_de;
  const content = lang==="zh"?s.template.content_zh:lang==="en"?s.template.content_en:s.template.content_de;
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
  <style>body{font-family:Arial,sans-serif;color:#111;margin:0}.page{max-width:760px;margin:0 auto;padding:48px}.brand{font-weight:800;color:#008254}.meta{font-size:12px;color:#666;margin:8px 0 28px}.content{white-space:pre-wrap;line-height:1.7;font-size:14px;min-height:500px}.sign{margin-top:60px;display:grid;grid-template-columns:1fr 1fr;gap:40px}.line{border-top:1px solid #222;padding-top:8px;font-size:12px}@media print{.page{padding:24px}.no-print{display:none}}</style></head><body><div class="page">
  <div class="brand">OPPO AUSTRIA · REFERRAL</div><h1>${esc(title)}</h1>
  <div class="meta">Version: ${esc(s.template.version)} · ${esc(user.email || "")}</div>
  <div class="content">${esc(content)}</div>
  <div class="sign"><div class="line">Name / Name</div><div class="line">Unterschrift / Signature / 签名</div></div>
  <div class="sign"><div class="line">Ort / Place / 地点</div><div class="line">Datum / Date / 日期</div></div>
  </div></body></html>`;

  return new Response(html,{
    status:200,
    headers:{
      "content-type":"text/html; charset=utf-8",
      "content-disposition":`attachment; filename="OPPO-Referral-Agreement-${s.template.version}.html"`,
      "cache-control":"private, no-store",
    },
  });
}
