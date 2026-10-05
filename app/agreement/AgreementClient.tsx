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
  status: "paper_requested" | "paper_received" | "submitted" | "approved" | "rejected" | "superseded";
  signing_method?: "electronic" | "paper";
  paper_status?: "requested" | "received" | "completed" | null;
  signed_at?: string | null;
  paper_received_at?: string | null;
  completed_at?: string | null;
  reviewed_at?: string | null;
  review_note?: string | null;
  content_hash?: string | null;
};

type AgreementStatus = {
  required: boolean;
  template: Template | null;
  agreement: Agreement | null;
  contractComplete?: boolean;
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
    title: "Vertragscenter",
    intro: "Der Vertrag ist Teil der Registrierungsprüfung, blockiert aber nicht Ihr Referral Dashboard. Sie können den Vertrag nach der Registrierung in Ruhe abschließen.",
    dashboard: "Zurück zum Referral Dashboard",
    download: "Vertrag herunterladen",
    paper: "Papiervertrag",
    paperHelp: "Vertrag herunterladen, ausdrucken, unterschreiben und an OPPO Austria / Rfriend Services GmbH zurücksenden.",
    choosePaper: "Papiervertrag wählen",
    electronic: "Elektronisch unterschreiben",
    eHelp: "Direkt online lesen, unterschreiben und zur Prüfung einreichen.",
    signer: "Vollständiger Name",
    signature: "Unterschrift",
    clear: "Unterschrift löschen",
    accept: "Ich habe die Vereinbarung gelesen und stimme ihr zu.",
    submit: "Elektronisch unterschreiben und einreichen",
    status: "Vertragsstatus",
    notStarted: "Noch nicht begonnen",
    paperRequested: "Papiervertrag gewählt – Rücksendung ausstehend",
    paperReceived: "Papiervertrag eingegangen",
    submitted: "Elektronisch unterschrieben – Prüfung ausstehend",
    approved: "Vertrag bestätigt",
    rejected: "Vertrag benötigt Korrektur",
    switchElectronic: "Stattdessen elektronisch unterschreiben",
    mailTo: "Rücksendung",
    logout: "Abmelden",
    loading: "Vertragsdaten werden geladen …",
  },
  en: {
    title: "Contract center",
    intro: "The contract is one checkpoint in registration review, but it does not block your referral dashboard. You can complete it after registration.",
    dashboard: "Back to referral dashboard",
    download: "Download contract",
    paper: "Paper contract",
    paperHelp: "Download, print and sign the contract, then return it to OPPO Austria / Rfriend Services GmbH.",
    choosePaper: "Choose paper contract",
    electronic: "Electronic signature",
    eHelp: "Read and sign online, then submit it for review.",
    signer: "Full legal name",
    signature: "Signature",
    clear: "Clear signature",
    accept: "I have read and agree to the agreement.",
    submit: "Sign electronically and submit",
    status: "Contract status",
    notStarted: "Not started",
    paperRequested: "Paper contract selected – awaiting return",
    paperReceived: "Paper contract received",
    submitted: "Electronically signed – pending review",
    approved: "Contract confirmed",
    rejected: "Contract requires correction",
    switchElectronic: "Switch to electronic signature",
    mailTo: "Return address",
    logout: "Sign out",
    loading: "Loading contract data …",
  },
  zh: {
    title: "合同中心",
    intro: "合同是注册审核中的一个审核点，但不会阻止你进入推荐者后台。完成注册后，可以再选择纸质合同或电子签完成签署。",
    dashboard: "返回推荐者 Dashboard",
    download: "下载合同",
    paper: "纸质合同",
    paperHelp: "下载合同后打印、签字，再寄回 OPPO Austria / Rfriend Services GmbH。管理员收到后会在后台确认。",
    choosePaper: "选择纸质合同",
    electronic: "电子签署",
    eHelp: "在线阅读并手写签名，提交后由管理员审核。",
    signer: "签署人姓名",
    signature: "签名",
    clear: "清除签名",
    accept: "我已阅读并同意本协议内容。",
    submit: "电子签署并提交",
    status: "合同状态",
    notStarted: "尚未开始",
    paperRequested: "已选择纸质合同，等待寄回",
    paperReceived: "纸质合同已收到",
    submitted: "电子签已提交，等待审核",
    approved: "合同已确认完成",
    rejected: "合同需要修改",
    switchElectronic: "改用电子签",
    mailTo: "寄回地址",
    logout: "退出登录",
    loading: "正在加载合同信息…",
  },
} as const;

export default function AgreementClient() {
  const [lang,setLang]=useState<Lang>("de");
  const [status,setStatus]=useState<AgreementStatus|null>(null);
  const [profile,setProfile]=useState<Profile|null>(null);
  const [signerName,setSignerName]=useState("");
  const [accepted,setAccepted]=useState(false);
  const [hasSignature,setHasSignature]=useState(false);
  const [busy,setBusy]=useState("");
  const [error,setError]=useState("");
  const [showElectronic,setShowElectronic]=useState(false);
  const canvasRef=useRef<HTMLCanvasElement|null>(null);
  const drawing=useRef(false);
  const last=useRef<{x:number;y:number}|null>(null);
  const t=labels[lang];

  async function reload(){
    const [s,p]=await Promise.all([api<AgreementStatus>("/api/agreement"),api<Profile>("/api/profile")]);
    setStatus(s);setProfile(p);
    setSignerName(x=>x||[p.first_name,p.last_name].filter(Boolean).join(" "));
    if(p.language==="de"||p.language==="en"||p.language==="zh")setLang(p.language);
  }

  useEffect(()=>{
    const saved=window.localStorage.getItem("oppo_referral_lang");
    if(saved==="de"||saved==="en"||saved==="zh")setLang(saved);
    void reload().catch(e=>setError(e instanceof Error?e.message:"Unable to load contract"));
  },[]);

  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas||!showElectronic)return;
    const ratio=window.devicePixelRatio||1;
    const width=canvas.clientWidth,height=canvas.clientHeight;
    canvas.width=Math.floor(width*ratio);canvas.height=Math.floor(height*ratio);
    const ctx=canvas.getContext("2d");if(!ctx)return;
    ctx.scale(ratio,ratio);ctx.lineWidth=2.2;ctx.lineCap="round";ctx.lineJoin="round";ctx.strokeStyle="#111";
  },[showElectronic,status?.agreement?.status]);

  function point(e:React.PointerEvent<HTMLCanvasElement>){const r=e.currentTarget.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
  function start(e:React.PointerEvent<HTMLCanvasElement>){drawing.current=true;last.current=point(e);e.currentTarget.setPointerCapture(e.pointerId)}
  function move(e:React.PointerEvent<HTMLCanvasElement>){if(!drawing.current||!last.current)return;const ctx=e.currentTarget.getContext("2d");if(!ctx)return;const p=point(e);ctx.beginPath();ctx.moveTo(last.current.x,last.current.y);ctx.lineTo(p.x,p.y);ctx.stroke();last.current=p;setHasSignature(true)}
  function end(e:React.PointerEvent<HTMLCanvasElement>){drawing.current=false;last.current=null;try{e.currentTarget.releasePointerCapture(e.pointerId)}catch{}}
  function clearSignature(){const canvas=canvasRef.current,ctx=canvas?.getContext("2d");if(canvas&&ctx)ctx.clearRect(0,0,canvas.width,canvas.height);setHasSignature(false)}

  async function choosePaper(){
    setBusy("paper");setError("");
    try{
      await api("/api/agreement/paper",{method:"POST",body:JSON.stringify({signerName:signerName.trim(),language:lang})});
      await reload();
    }catch(e){setError(e instanceof Error?e.message:"Unable to choose paper contract")}finally{setBusy("")}
  }

  async function submitElectronic(){
    if(!profile||!status?.template||!canvasRef.current||!accepted||!hasSignature||signerName.trim().length<2)return;
    setBusy("electronic");setError("");
    try{
      const blob=await new Promise<Blob>((resolve,reject)=>canvasRef.current!.toBlob(b=>b?resolve(b):reject(new Error("Signature export failed")),"image/png"));
      const path=`${profile.id}/${status.template.version}/${crypto.randomUUID()}.png`;
      const supabase=createBrowserSupabase();
      const {error:uploadError}=await supabase.storage.from("agreement-signatures").upload(path,blob,{contentType:"image/png",cacheControl:"0",upsert:false});
      if(uploadError)throw uploadError;
      await api("/api/agreement",{method:"POST",body:JSON.stringify({signerName:signerName.trim(),signaturePath:path,language:lang})});
      await reload();setShowElectronic(false);setAccepted(false);clearSignature();
    }catch(e){setError(e instanceof Error?e.message:"Unable to submit agreement")}finally{setBusy("")}
  }

  async function logout(){await api("/api/auth/logout",{method:"POST"}).catch(()=>undefined);window.location.assign("/portal/index.html")}

  if(!status||!profile)return <div style={{padding:40,fontFamily:"Arial,sans-serif"}}>{error||t.loading}</div>;

  const a=status.agreement;
  const title=lang==="zh"?status.template?.title_zh:lang==="en"?status.template?.title_en:status.template?.title_de;
  const content=lang==="zh"?status.template?.content_zh:lang==="en"?status.template?.content_en:status.template?.content_de;
  const label=a?.status==="approved"?t.approved:a?.status==="paper_received"?t.paperReceived:a?.status==="paper_requested"?t.paperRequested:a?.status==="submitted"?t.submitted:a?.status==="rejected"?t.rejected:t.notStarted;
  const complete=!!status.contractComplete;
  const canChoose=!a||a.status==="rejected"||a.status==="superseded";
  const canElectronic=canChoose||a?.status==="paper_requested";

  return <div style={{minHeight:"100vh",background:"#f4f6f7",fontFamily:"Arial,sans-serif",color:"#111"}}>
    <header style={{height:70,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",background:"#fff",borderBottom:"1px solid #e4e7ea"}}>
      <div style={{fontSize:19,fontWeight:900}}><span style={{color:"#008254"}}>OPPO</span> AUSTRIA · REFERRAL</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>window.location.assign("/my-referrals")} style={{padding:"9px 12px",border:"1px solid #d8dde3",borderRadius:9,background:"#fff",fontWeight:700}}>{t.dashboard}</button>
        <select value={lang} onChange={e=>{const v=e.target.value as Lang;setLang(v);window.localStorage.setItem("oppo_referral_lang",v)}} style={{padding:"9px 11px",border:"1px solid #d8dde3",borderRadius:9,background:"#fff"}}>
          <option value="de">DE</option><option value="en">EN</option><option value="zh">中文</option>
        </select>
        <button onClick={()=>void logout()} style={{padding:"9px 12px",border:"1px solid #d8dde3",borderRadius:9,background:"#fff",fontWeight:700}}>{t.logout}</button>
      </div>
    </header>

    <main style={{maxWidth:980,margin:"0 auto",padding:"30px 18px 60px"}}>
      {error?<div style={{padding:12,background:"#fff1f2",color:"#b42318",borderRadius:10,marginBottom:16}}>{error}</div>:null}
      <section style={{background:"#fff",border:"1px solid #e3e6ea",borderRadius:18,padding:24,marginBottom:18}}>
        <div style={{fontSize:12,fontWeight:900,color:complete?"#008254":"#b26a00",textTransform:"uppercase"}}>{t.status}</div>
        <div style={{fontSize:26,fontWeight:900,marginTop:6}}>{label}</div>
        <p style={{color:"#68707a",lineHeight:1.6,marginBottom:0}}>{t.intro}</p>
        {a?.review_note?<div style={{marginTop:12,padding:12,borderRadius:10,background:"#fff7ed",color:"#7c4a14"}}>{a.review_note}</div>:null}
      </section>

      <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16,marginBottom:18}}>
        <div style={{background:"#fff",border:"1px solid #e3e6ea",borderRadius:18,padding:22}}>
          <h2 style={{margin:"0 0 8px"}}>{t.paper}</h2>
          <p style={{color:"#68707a",lineHeight:1.6,minHeight:48}}>{t.paperHelp}</p>
          <a href={`/api/agreement/download?lang=${lang}`} style={{display:"inline-block",padding:"11px 14px",border:"1px solid #d8dde3",borderRadius:9,textDecoration:"none",color:"#111",fontWeight:800}}>{t.download}</a>
          <div style={{marginTop:14,padding:12,borderRadius:10,background:"#f7f8fa",fontSize:12,lineHeight:1.6}}>
            <b>{t.mailTo}</b><br/>Rfriend Services GmbH · OPPO Store Österreich<br/>DC Tower 1, 30F · Wien, Österreich
          </div>
          {(canChoose)&&<button disabled={busy==="paper"} onClick={()=>void choosePaper()} style={{marginTop:14,width:"100%",padding:"12px 14px",border:0,borderRadius:9,background:"#111",color:"#fff",fontWeight:800,cursor:"pointer"}}>{t.choosePaper}</button>}
        </div>

        <div style={{background:"#fff",border:"1px solid #e3e6ea",borderRadius:18,padding:22}}>
          <h2 style={{margin:"0 0 8px"}}>{t.electronic}</h2>
          <p style={{color:"#68707a",lineHeight:1.6,minHeight:48}}>{t.eHelp}</p>
          {canElectronic?<button onClick={()=>setShowElectronic(v=>!v)} style={{width:"100%",padding:"12px 14px",border:0,borderRadius:9,background:"#008254",color:"#fff",fontWeight:800,cursor:"pointer"}}>{a?.status==="paper_requested"?t.switchElectronic:t.electronic}</button>:<div style={{padding:12,borderRadius:10,background:"#f7f8fa",fontSize:13}}>{label}</div>}
        </div>
      </section>

      {showElectronic&&canElectronic?<section style={{background:"#fff",border:"1px solid #e3e6ea",borderRadius:18,overflow:"hidden"}}>
        <div style={{padding:"22px 24px",borderBottom:"1px solid #eef0f2"}}><div style={{fontSize:12,color:"#008254",fontWeight:900}}>{status.template?.version}</div><h2 style={{margin:"6px 0 0"}}>{title}</h2></div>
        <div style={{margin:24,padding:"28px 30px",minHeight:260,border:"1px solid #dfe3e7",borderRadius:8,whiteSpace:"pre-wrap",lineHeight:1.7,fontSize:14}}>{content}</div>
        <div style={{padding:"0 24px 26px"}}>
          <label style={{display:"grid",gap:6,fontSize:13,fontWeight:800}}>{t.signer}<input value={signerName} onChange={e=>setSignerName(e.target.value)} style={{padding:"12px 13px",border:"1px solid #d8dde3",borderRadius:10}}/></label>
          <div style={{marginTop:18,display:"flex",justifyContent:"space-between"}}><b style={{fontSize:13}}>{t.signature}</b><button onClick={clearSignature} style={{border:0,background:"transparent",color:"#68707a"}}>{t.clear}</button></div>
          <canvas ref={canvasRef} onPointerDown={start} onPointerMove={move} onPointerUp={end} onPointerCancel={end} style={{display:"block",width:"100%",height:170,border:"1px solid #cfd5db",borderRadius:10,background:"#fff",touchAction:"none",cursor:"crosshair",marginTop:7}}/>
          <label style={{display:"flex",gap:9,marginTop:16,fontSize:13,lineHeight:1.5}}><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>{t.accept}</span></label>
          <button disabled={busy==="electronic"||!accepted||!hasSignature||signerName.trim().length<2} onClick={()=>void submitElectronic()} style={{marginTop:16,width:"100%",padding:"13px 16px",border:0,borderRadius:10,background:"#008254",color:"#fff",fontWeight:900,opacity:(busy==="electronic"||!accepted||!hasSignature||signerName.trim().length<2)?.5:1}}>{busy==="electronic"?"…":t.submit}</button>
        </div>
      </section>:null}
    </main>
  </div>;
}
