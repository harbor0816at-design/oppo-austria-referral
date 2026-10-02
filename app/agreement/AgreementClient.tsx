"use client";

import { useEffect, useRef, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Lang = "de" | "en" | "zh";

type Template = {
  id: string;
  version: string;
  title_de: string;
  title_en: string;
  title_zh: string;
  content_de: string;
  content_en: string;
  content_zh: string;
};

type Agreement = {
  id: string;
  status: "submitted" | "approved" | "rejected" | "superseded";
  signed_at: string;
  reviewed_at?: string | null;
  review_note?: string | null;
  content_hash?: string | null;
};

type AgreementStatus = {
  required: boolean;
  template: Template | null;
  agreement: Agreement | null;
};

type Profile = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  language?: string | null;
};

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.success) throw new Error(body?.error?.message || "Request failed");
  return body.data as T;
}

const labels = {
  de: {
    title: "Referral Vereinbarung",
    intro: "Bitte lesen und unterzeichnen Sie die Vereinbarung. Ihr Referral-Konto wird nach Prüfung durch einen Administrator freigeschaltet.",
    signer: "Vollständiger Name",
    signature: "Unterschrift",
    clear: "Unterschrift löschen",
    accept: "Ich habe die Vereinbarung gelesen und stimme ihr zu.",
    submit: "Vereinbarung unterzeichnen und einreichen",
    pendingTitle: "Vereinbarung eingereicht",
    pendingText: "Ihre Vereinbarung wartet auf die Prüfung durch einen Administrator. Nach Freigabe erhalten Sie Zugriff auf Ihr Referral Dashboard.",
    approvedTitle: "Vereinbarung freigegeben",
    approvedText: "Ihre Vereinbarung wurde freigegeben. Sie können jetzt Ihr Referral Dashboard öffnen.",
    rejectedTitle: "Vereinbarung abgelehnt",
    rejectedText: "Bitte prüfen Sie den Hinweis des Administrators und reichen Sie die Vereinbarung erneut ein.",
    dashboard: "Referral Dashboard öffnen",
    logout: "Abmelden",
    loading: "Vereinbarung wird geladen …",
    placeholder: "Vorläufige Vertragsvorlage. Der endgültige Vertragstext wird später ergänzt.",
  },
  en: {
    title: "Referral Agreement",
    intro: "Please read and sign the agreement. Your referral account will be activated after administrator review.",
    signer: "Full legal name",
    signature: "Signature",
    clear: "Clear signature",
    accept: "I have read the agreement and agree to its terms.",
    submit: "Sign and submit agreement",
    pendingTitle: "Agreement submitted",
    pendingText: "Your agreement is waiting for administrator review. You will receive access to your referral dashboard after approval.",
    approvedTitle: "Agreement approved",
    approvedText: "Your agreement has been approved. You can now open your referral dashboard.",
    rejectedTitle: "Agreement rejected",
    rejectedText: "Please review the administrator note and submit the agreement again.",
    dashboard: "Open referral dashboard",
    logout: "Sign out",
    loading: "Loading agreement …",
    placeholder: "Temporary agreement template. Final contractual terms will be added later.",
  },
  zh: {
    title: "OPPO Austria 推荐合作协议",
    intro: "请阅读并签署协议。协议提交后需要管理员审核，通过后才会开放推荐者后台。",
    signer: "签署人姓名",
    signature: "签名",
    clear: "清除签名",
    accept: "我已阅读并同意本协议内容。",
    submit: "签署并提交协议",
    pendingTitle: "协议已提交",
    pendingText: "协议正在等待管理员审核。审核通过后即可进入推荐者 Dashboard。",
    approvedTitle: "协议已审核通过",
    approvedText: "你的协议已经通过审核，现在可以进入推荐者 Dashboard。",
    rejectedTitle: "协议未通过审核",
    rejectedText: "请查看管理员备注，修改后重新签署提交。",
    dashboard: "进入推荐者 Dashboard",
    logout: "退出登录",
    loading: "正在加载协议…",
    placeholder: "当前为临时空白协议模板，正式合同条款后续补充。",
  },
} as const;

export default function AgreementClient() {
  const [lang, setLang] = useState<Lang>("de");
  const [status, setStatus] = useState<AgreementStatus | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [signerName, setSignerName] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{x:number;y:number}|null>(null);
  const t = labels[lang];

  useEffect(() => {
    const saved = window.localStorage.getItem("oppo_referral_lang");
    if (saved === "de" || saved === "en" || saved === "zh") setLang(saved);
    void (async () => {
      try {
        const [s,p] = await Promise.all([
          api<AgreementStatus>("/api/agreement"),
          api<Profile>("/api/profile"),
        ]);
        setStatus(s);
        setProfile(p);
        setSignerName([p.first_name,p.last_name].filter(Boolean).join(" "));
        if (p.language === "de" || p.language === "en" || p.language === "zh") setLang(p.language);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load agreement");
      }
    })();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111";
  }, [status?.agreement?.status]);

  function point(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function start(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = true;
    last.current = point(e);
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current || !last.current) return;
    const ctx = e.currentTarget.getContext("2d");
    if (!ctx) return;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(last.current.x,last.current.y);
    ctx.lineTo(p.x,p.y);
    ctx.stroke();
    last.current = p;
    setHasSignature(true);
  }

  function end(e: React.PointerEvent<HTMLCanvasElement>) {
    drawing.current = false;
    last.current = null;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
  }

  function clearSignature() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (canvas && ctx) ctx.clearRect(0,0,canvas.width,canvas.height);
    setHasSignature(false);
  }

  async function submit() {
    if (!profile || !status?.template || !canvasRef.current || !accepted || !hasSignature || signerName.trim().length < 2) return;
    setBusy(true);
    setError("");
    try {
      const blob = await new Promise<Blob>((resolve,reject) => {
        canvasRef.current!.toBlob(b => b ? resolve(b) : reject(new Error("Signature export failed")), "image/png");
      });
      const path = `${profile.id}/${status.template.version}/${crypto.randomUUID()}.png`;
      const supabase = createBrowserSupabase();
      const { error: uploadError } = await supabase.storage.from("agreement-signatures").upload(path,blob,{
        contentType:"image/png",
        cacheControl:"0",
        upsert:false,
      });
      if (uploadError) throw uploadError;
      await api("/api/agreement",{
        method:"POST",
        body:JSON.stringify({ signerName:signerName.trim(), signaturePath:path, language:lang }),
      });
      setStatus(await api<AgreementStatus>("/api/agreement"));
      clearSignature();
      setAccepted(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to submit agreement");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    await api("/api/auth/logout",{method:"POST"}).catch(()=>undefined);
    window.location.assign("/portal/index.html");
  }

  if (!status || !profile) return <div style={{padding:40,fontFamily:"Arial,sans-serif"}}>{error || t.loading}</div>;

  const title = lang === "zh" ? status.template?.title_zh : lang === "en" ? status.template?.title_en : status.template?.title_de;
  const content = lang === "zh" ? status.template?.content_zh : lang === "en" ? status.template?.content_en : status.template?.content_de;
  const current = status.agreement;

  return <div style={{minHeight:"100vh",background:"#f4f6f7",fontFamily:"Arial,sans-serif",color:"#111"}}>
    <header style={{height:70,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",background:"#fff",borderBottom:"1px solid #e4e7ea"}}>
      <div style={{fontSize:19,fontWeight:900}}><span style={{color:"#008254"}}>OPPO</span> AUSTRIA · REFERRAL</div>
      <div style={{display:"flex",gap:8}}>
        <select value={lang} onChange={e=>{const v=e.target.value as Lang;setLang(v);window.localStorage.setItem("oppo_referral_lang",v)}} style={{padding:"9px 11px",border:"1px solid #d8dde3",borderRadius:9,background:"#fff"}}>
          <option value="de">DE</option><option value="en">EN</option><option value="zh">中文</option>
        </select>
        <button onClick={()=>void logout()} style={{padding:"9px 12px",border:"1px solid #d8dde3",borderRadius:9,background:"#fff",fontWeight:700}}>{t.logout}</button>
      </div>
    </header>

    <main style={{maxWidth:900,margin:"0 auto",padding:"32px 18px 60px"}}>
      {error ? <div style={{padding:12,background:"#fff1f2",color:"#b42318",borderRadius:10,marginBottom:16}}>{error}</div> : null}

      {current?.status === "approved" ? <section style={{background:"#fff",border:"1px solid #cce8dc",borderRadius:18,padding:28}}>
        <div style={{fontSize:12,fontWeight:900,color:"#008254",textTransform:"uppercase"}}>Approved</div>
        <h1 style={{fontSize:30,margin:"8px 0"}}>{t.approvedTitle}</h1>
        <p style={{color:"#626a73",lineHeight:1.6}}>{t.approvedText}</p>
        <button onClick={()=>window.location.assign("/my-referrals")} style={{marginTop:16,padding:"12px 18px",border:0,borderRadius:10,background:"#008254",color:"#fff",fontWeight:800}}>{t.dashboard}</button>
      </section> : current?.status === "submitted" ? <section style={{background:"#fff",border:"1px solid #e3e6ea",borderRadius:18,padding:28}}>
        <div style={{fontSize:12,fontWeight:900,color:"#b26a00",textTransform:"uppercase"}}>Pending review</div>
        <h1 style={{fontSize:30,margin:"8px 0"}}>{t.pendingTitle}</h1>
        <p style={{color:"#626a73",lineHeight:1.6}}>{t.pendingText}</p>
        <div style={{marginTop:18,padding:14,borderRadius:12,background:"#f7f8fa",fontSize:13}}>
          <b>{current.signed_at ? new Date(current.signed_at).toLocaleString() : ""}</b>
          {current.content_hash ? <div style={{marginTop:7,fontFamily:"monospace",fontSize:11,color:"#6d7480",wordBreak:"break-all"}}>SHA-256: {current.content_hash}</div> : null}
        </div>
      </section> : <>
        {current?.status === "rejected" ? <section style={{background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:14,padding:16,marginBottom:18}}>
          <b>{t.rejectedTitle}</b>
          <p style={{margin:"6px 0 0",color:"#7c4a14"}}>{t.rejectedText}</p>
          {current.review_note ? <div style={{marginTop:10,padding:10,background:"#fff",borderRadius:8}}>{current.review_note}</div> : null}
        </section> : null}

        <section style={{background:"#fff",border:"1px solid #e3e6ea",borderRadius:18,overflow:"hidden"}}>
          <div style={{padding:"24px 26px",borderBottom:"1px solid #eef0f2"}}>
            <div style={{fontSize:12,fontWeight:900,color:"#008254",textTransform:"uppercase"}}>{status.template?.version}</div>
            <h1 style={{fontSize:30,margin:"7px 0 6px"}}>{title || t.title}</h1>
            <p style={{margin:0,color:"#68707a",lineHeight:1.6}}>{t.intro}</p>
          </div>
          <div style={{margin:26,padding:"30px 34px",minHeight:330,border:"1px solid #dfe3e7",borderRadius:8,background:"#fff",boxShadow:"0 2px 8px rgba(0,0,0,.03)"}}>
            <div style={{fontSize:13,color:"#8a9098",marginBottom:20}}>{profile.email}</div>
            <div style={{whiteSpace:"pre-wrap",lineHeight:1.75,fontSize:14,color:"#292d32"}}>{content || t.placeholder}</div>
          </div>
          <div style={{padding:"0 26px 28px"}}>
            <label style={{display:"grid",gap:6,fontSize:13,fontWeight:800}}>
              {t.signer}
              <input value={signerName} onChange={e=>setSignerName(e.target.value)} style={{padding:"12px 13px",border:"1px solid #d8dde3",borderRadius:10,fontSize:14}} />
            </label>

            <div style={{marginTop:18}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:7}}>
                <b style={{fontSize:13}}>{t.signature}</b>
                <button type="button" onClick={clearSignature} style={{border:0,background:"transparent",color:"#68707a",cursor:"pointer"}}>{t.clear}</button>
              </div>
              <canvas
                ref={canvasRef}
                onPointerDown={start}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                style={{display:"block",width:"100%",height:170,border:"1px solid #cfd5db",borderRadius:10,background:"#fff",touchAction:"none",cursor:"crosshair"}}
              />
            </div>

            <label style={{display:"flex",alignItems:"flex-start",gap:9,marginTop:18,fontSize:13,lineHeight:1.5}}>
              <input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} style={{marginTop:2}} />
              <span>{t.accept}</span>
            </label>

            <button
              type="button"
              disabled={busy || !accepted || !hasSignature || signerName.trim().length < 2}
              onClick={()=>void submit()}
              style={{marginTop:18,width:"100%",padding:"13px 16px",border:0,borderRadius:10,background:"#008254",color:"#fff",fontWeight:900,opacity:(busy || !accepted || !hasSignature || signerName.trim().length < 2)?.5:1,cursor:"pointer"}}
            >
              {busy ? "…" : t.submit}
            </button>
          </div>
        </section>
      </>}
    </main>
  </div>;
}
