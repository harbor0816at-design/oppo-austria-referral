"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Tab = "overview"|"leads"|"today"|"content"|"showroom"|"orders";
type Customer = {
  id:string; full_name:string; whatsapp?:string|null; email?:string|null; state:string;
  temperature:"cold"|"warm"|"hot"; lead_score:number; product_interest_text?:string|null;
  primary_need?:string|null; purchase_barrier?:string|null; purchase_horizon?:string|null;
  next_action?:string|null; next_action_due?:string|null; satisfaction?:string|null;
  marketing_consent?:boolean; source?:string|null; current_device?:string|null;
};
type ActionRow = {id:string;customer_id:string;title:string;due_at:string;status:string;priority:string;outcome?:string|null};
type ContentRow = {id:string;content_code:string;title:string;category:string;purchase_barrier?:string|null;channel:string;language:string;body?:string|null;asset_url?:string|null;active:boolean};
type Appointment = {id:string;customer_id:string;appointment_at:string;status:string;purpose?:string|null;outcome?:string|null};
type Order = {id:string;order_number:string;customer_name?:string|null;email?:string|null;phone?:string|null;product_name?:string|null;gross_amount:number;currency:string;match_status:string;match_score:number;match_reason?:string|null;customer_id?:string|null};
type Snapshot = {
  dashboard:{customers:number;hot:number;dueToday:number;qualified:number;purchased:number;advocates:number;unmatchedOrders:number;leadToPurchase:number};
  customers:Customer[]; actions:ActionRow[]; content:ContentRow[]; appointments:Appointment[]; orders:Order[];
};

const box:React.CSSProperties={background:"#fff",border:"1px solid #e5e7eb",borderRadius:16};
const input:React.CSSProperties={border:"1px solid #d1d5db",borderRadius:9,padding:"9px 10px",fontSize:13,width:"100%",background:"#fff"};
const button:React.CSSProperties={border:0,borderRadius:9,padding:"9px 12px",fontWeight:700,cursor:"pointer"};
const primary:React.CSSProperties={...button,background:"#008254",color:"#fff"};
const secondary:React.CSSProperties={...button,background:"#fff",border:"1px solid #d1d5db",color:"#111827"};

async function api<T>(url:string,init?:RequestInit):Promise<T>{
  const res=await fetch(url,{credentials:"include",...init,headers:{...(init?.body instanceof FormData?{}:{"content-type":"application/json"}),...(init?.headers||{})}});
  const body=await res.json().catch(()=>({}));
  if(!res.ok||!body.success) throw new Error(body?.error?.message||"Request failed");
  return body.data as T;
}
function dueLocal(hours=24){const d=new Date(Date.now()+hours*3600000);const z=(n:number)=>String(n).padStart(2,"0");return `${d.getFullYear()}-${z(d.getMonth()+1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`;}
function waLink(value?:string|null){const p=String(value||"").replace(/[^0-9]/g,"").replace(/^00/,"");return p?`https://wa.me/${p}`:"#";}
const stages=["new","qualified","decision","high_intent","showroom","purchased","owner","referral_eligible","advocate","lost"];
const barriers=["","Price","Camera","Battery","Brand Trust","Warranty","iPhone Switching","Samsung Comparison","Payment","Availability","Waiting","Other"];

export default function OpsClient({staffEmail,staffRole}:{staffEmail:string;staffRole:string}){
  const [tab,setTab]=useState<Tab>("overview");
  const [data,setData]=useState<Snapshot|null>(null);
  const [error,setError]=useState("");
  const [busy,setBusy]=useState("");
  const [lead,setLead]=useState({full_name:"",whatsapp:"",email:"",source:"whatsapp",current_device:"",product_interest_text:"",primary_need:"",purchase_barrier:"",purchase_horizon:"<30 days",lead_score:50,next_action:"Follow up",next_action_due:dueLocal(24),marketing_consent:false});
  const [asset,setAsset]=useState({content_code:"",title:"",category:"decision",purchase_barrier:"",channel:"whatsapp",language:"de",body:"",asset_url:""});
  const [appt,setAppt]=useState({customer_id:"",appointment_at:dueLocal(48),purpose:"Product experience"});
  const [orderFile,setOrderFile]=useState<File|null>(null);
  const [manualMatches,setManualMatches]=useState<Record<string,string>>({});

  const load=useCallback(async()=>{setError("");try{setData(await api<Snapshot>("/api/ops/snapshot"));}catch(e){setError(e instanceof Error?e.message:"Load failed");}},[]);
  useEffect(()=>{void load()},[load]);
  const customers=data?.customers||[];
  const byId=useMemo(()=>Object.fromEntries(customers.map(c=>[c.id,c])),[customers]);
  const openActions=(data?.actions||[]).filter(x=>x.status==="open").sort((a,b)=>a.due_at.localeCompare(b.due_at));
  const todays=openActions.filter(x=>new Date(x.due_at).getTime()<=Date.now()+86400000);
  const unmatched=(data?.orders||[]).filter(o=>o.match_status==="unmatched"||o.match_status==="possible");

  async function createLead(){
    setBusy("lead");setError("");
    try{
      await api("/api/ops/customers",{method:"POST",body:JSON.stringify(lead)});
      setLead({full_name:"",whatsapp:"",email:"",source:"whatsapp",current_device:"",product_interest_text:"",primary_need:"",purchase_barrier:"",purchase_horizon:"<30 days",lead_score:50,next_action:"Follow up",next_action_due:dueLocal(24),marketing_consent:false});
      await load();
    }catch(e){setError(e instanceof Error?e.message:"Create failed")}finally{setBusy("")}
  }
  async function patchCustomer(id:string,patch:Record<string,unknown>){
    setBusy("customer");setError("");
    try{await api("/api/ops/customers",{method:"PATCH",body:JSON.stringify({id,...patch})});await load();}
    catch(e){setError(e instanceof Error?e.message:"Update failed")}finally{setBusy("")}
  }
  async function completeAction(id:string){
    setBusy(id);setError("");
    try{await api("/api/ops/actions",{method:"PATCH",body:JSON.stringify({id,status:"done"})});await load();}
    catch(e){setError(e instanceof Error?e.message:"Action failed")}finally{setBusy("")}
  }
  async function createAsset(){
    setBusy("asset");setError("");
    try{await api("/api/ops/content",{method:"POST",body:JSON.stringify(asset)});setAsset({content_code:"",title:"",category:"decision",purchase_barrier:"",channel:"whatsapp",language:"de",body:"",asset_url:""});await load();}
    catch(e){setError(e instanceof Error?e.message:"Content save failed")}finally{setBusy("")}
  }
  async function createAppointment(){
    if(!appt.customer_id)return;
    setBusy("appt");setError("");
    try{await api("/api/ops/appointments",{method:"POST",body:JSON.stringify(appt)});await load();}
    catch(e){setError(e instanceof Error?e.message:"Appointment failed")}finally{setBusy("")}
  }
  async function uploadOrders(){
    if(!orderFile)return;
    setBusy("orders");setError("");
    try{
      const form=new FormData();form.append("file",orderFile);
      await api("/api/ops/orders/import",{method:"POST",body:form});
      setOrderFile(null);await load();
    }catch(e){setError(e instanceof Error?e.message:"Order import failed")}finally{setBusy("")}
  }
  async function matchOrder(orderId:string){
    const customerId=manualMatches[orderId];if(!customerId)return;
    setBusy(orderId);setError("");
    try{await api("/api/ops/orders/match",{method:"POST",body:JSON.stringify({order_id:orderId,customer_id:customerId})});await load();}
    catch(e){setError(e instanceof Error?e.message:"Match failed")}finally{setBusy("")}
  }

  const cards=[
    ["Customers",data?.dashboard.customers||0],
    ["Hot leads",data?.dashboard.hot||0],
    ["Due / 24h",data?.dashboard.dueToday||0],
    ["Purchased",data?.dashboard.purchased||0],
    ["Lead → Purchase",`${data?.dashboard.leadToPurchase||0}%`],
    ["Orders to review",data?.dashboard.unmatchedOrders||0],
  ];

  return <div style={{minHeight:"100vh",background:"#f5f7f8",fontFamily:"Arial, sans-serif",color:"#15171a"}}>
    <header style={{height:72,background:"#fff",borderBottom:"1px solid #e5e7eb",display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 24px",position:"sticky",top:0,zIndex:20}}>
      <div><div style={{fontSize:11,fontWeight:900,color:"#008254",letterSpacing:1}}>OPPO AUSTRIA</div><div style={{fontSize:22,fontWeight:800}}>Customer Relationship OS</div></div>
      <div style={{display:"flex",gap:10,alignItems:"center"}}><a href="/admin" style={{...secondary,textDecoration:"none"}}>Referral Admin</a><div style={{fontSize:12,textAlign:"right"}}><b>{staffEmail}</b><div style={{color:"#6b7280"}}>{staffRole}</div></div></div>
    </header>
    <div style={{display:"grid",gridTemplateColumns:"210px 1fr",minHeight:"calc(100vh - 72px)"}}>
      <aside style={{background:"#fff",borderRight:"1px solid #e5e7eb",padding:14}}>
        {([["overview","Overview"],["leads","Leads"],["today","Today"],["content","Content"],["showroom","Showroom"],["orders","Orders"]] as [Tab,string][]).map(([k,n])=>
          <button key={k} onClick={()=>setTab(k)} style={{...button,width:"100%",textAlign:"left",marginBottom:5,background:tab===k?"#e8f5ef":"transparent",color:tab===k?"#008254":"#374151"}}>{n}</button>
        )}
      </aside>
      <main style={{padding:24,minWidth:0}}>
        {error?<div style={{background:"#fff1f2",color:"#b42318",padding:12,borderRadius:10,marginBottom:16}}>{error}</div>:null}

        {tab==="overview"?<div style={{display:"grid",gap:18}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(150px,1fr))",gap:14}}>
            {cards.map(([n,v])=><div key={String(n)} style={{...box,padding:18}}><div style={{fontSize:12,color:"#6b7280"}}>{n}</div><div style={{fontSize:30,fontWeight:900,marginTop:8}}>{v}</div></div>)}
          </div>
          <section style={{...box,padding:18}}>
            <h3 style={{marginTop:0}}>Operating principle</h3>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10}}>
              {["Value Exchange","Advisory","Lower Risk","Unlock Value","Expand"].map((x,i)=><div key={x} style={{padding:14,borderRadius:12,background:"#f7f8fa"}}><b>{i+1}. {x}</b><div style={{fontSize:12,color:"#6b7280",marginTop:5}}>{["Acquire a useful conversation","Understand need & intent","Remove the buying barrier","Activate owner value","Trigger advocacy"][i]}</div></div>)}
            </div>
          </section>
          <section style={{...box,padding:18}}>
            <h3 style={{marginTop:0}}>Priority queue</h3>
            {todays.slice(0,8).map(a=><ActionCard key={a.id} a={a} customer={byId[a.customer_id]} busy={busy} onDone={completeAction}/>)}
            {!todays.length?<div style={{color:"#6b7280"}}>No urgent actions.</div>:null}
          </section>
        </div>:null}

        {tab==="leads"?<div style={{display:"grid",gap:18}}>
          <section style={{...box,padding:18}}>
            <h3 style={{marginTop:0}}>New WhatsApp lead</h3>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              <Field label="Customer"><input style={input} value={lead.full_name} onChange={e=>setLead({...lead,full_name:e.target.value})}/></Field>
              <Field label="WhatsApp"><input style={input} value={lead.whatsapp} onChange={e=>setLead({...lead,whatsapp:e.target.value})}/></Field>
              <Field label="Email"><input style={input} value={lead.email} onChange={e=>setLead({...lead,email:e.target.value})}/></Field>
              <Field label="Current device"><input style={input} value={lead.current_device} onChange={e=>setLead({...lead,current_device:e.target.value})}/></Field>
              <Field label="Product interest"><input style={input} value={lead.product_interest_text} onChange={e=>setLead({...lead,product_interest_text:e.target.value})}/></Field>
              <Field label="Primary need"><input style={input} value={lead.primary_need} onChange={e=>setLead({...lead,primary_need:e.target.value})}/></Field>
              <Field label="Purchase barrier"><select style={input} value={lead.purchase_barrier} onChange={e=>setLead({...lead,purchase_barrier:e.target.value})}>{barriers.map(x=><option key={x}>{x}</option>)}</select></Field>
              <Field label="Purchase horizon"><select style={input} value={lead.purchase_horizon} onChange={e=>setLead({...lead,purchase_horizon:e.target.value})}><option>Now</option><option>&lt;30 days</option><option>30–90 days</option><option>Later</option></select></Field>
              <Field label="Lead score"><input style={input} type="number" min={0} max={100} value={lead.lead_score} onChange={e=>setLead({...lead,lead_score:Number(e.target.value)})}/></Field>
              <Field label="Next action"><input style={input} value={lead.next_action} onChange={e=>setLead({...lead,next_action:e.target.value})}/></Field>
              <Field label="Due"><input style={input} type="datetime-local" value={lead.next_action_due} onChange={e=>setLead({...lead,next_action_due:e.target.value})}/></Field>
              <Field label="Marketing permission"><label style={{display:"flex",gap:8,alignItems:"center",height:38}}><input type="checkbox" checked={lead.marketing_consent} onChange={e=>setLead({...lead,marketing_consent:e.target.checked})}/> Consent recorded</label></Field>
            </div>
            <button style={{...primary,marginTop:12}} disabled={!lead.full_name||!!busy} onClick={()=>void createLead()}>Create lead</button>
          </section>

          <section style={{...box,overflow:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:1100}}>
              <thead><tr style={{background:"#f7f8fa",textAlign:"left",color:"#6b7280"}}>
                {["Customer","Interest","Barrier","Score","State","Next action","WhatsApp"].map(x=><th key={x} style={{padding:11}}>{x}</th>)}
              </tr></thead>
              <tbody>{customers.map(c=><tr key={c.id} style={{borderTop:"1px solid #eef0f2"}}>
                <td style={{padding:11}}><b>{c.full_name}</b><div style={{color:"#6b7280"}}>{c.email||""}</div></td>
                <td style={{padding:11}}>{c.product_interest_text||"—"}<div style={{color:"#6b7280"}}>{c.primary_need||""}</div></td>
                <td style={{padding:11}}><select style={{...input,minWidth:135}} value={c.purchase_barrier||""} onChange={e=>void patchCustomer(c.id,{purchase_barrier:e.target.value})}>{barriers.map(x=><option key={x}>{x}</option>)}</select></td>
                <td style={{padding:11}}><input style={{...input,width:72}} type="number" min={0} max={100} value={c.lead_score} onChange={e=>void patchCustomer(c.id,{lead_score:Number(e.target.value)})}/><div style={{fontWeight:800,color:c.temperature==="hot"?"#b42318":c.temperature==="warm"?"#9a6700":"#6b7280"}}>{c.temperature.toUpperCase()}</div></td>
                <td style={{padding:11}}><select style={{...input,minWidth:135}} value={c.state} onChange={e=>void patchCustomer(c.id,{state:e.target.value})}>{stages.map(s=><option key={s} value={s}>{s}</option>)}</select></td>
                <td style={{padding:11}}>{c.next_action||"—"}<div style={{color:"#6b7280"}}>{c.next_action_due?new Date(c.next_action_due).toLocaleString():""}</div></td>
                <td style={{padding:11}}>{c.whatsapp?<a style={{...primary,textDecoration:"none",display:"inline-block"}} target="_blank" href={waLink(c.whatsapp)}>Open WhatsApp</a>:"—"}</td>
              </tr>)}</tbody>
            </table>
          </section>
        </div>:null}

        {tab==="today"?<section style={{...box,padding:18}}>
          <h3 style={{marginTop:0}}>Next actions</h3>
          {openActions.map(a=><ActionCard key={a.id} a={a} customer={byId[a.customer_id]} busy={busy} onDone={completeAction}/>)}
          {!openActions.length?<div style={{color:"#6b7280"}}>No open actions.</div>:null}
        </section>:null}

        {tab==="content"?<div style={{display:"grid",gridTemplateColumns:"360px 1fr",gap:18,alignItems:"start"}}>
          <section style={{...box,padding:18}}>
            <h3 style={{marginTop:0}}>Add sales asset</h3>
            <div style={{display:"grid",gap:10}}>
              <Field label="Content ID"><input style={input} placeholder="CAM-01" value={asset.content_code} onChange={e=>setAsset({...asset,content_code:e.target.value})}/></Field>
              <Field label="Title"><input style={input} value={asset.title} onChange={e=>setAsset({...asset,title:e.target.value})}/></Field>
              <Field label="Category"><select style={input} value={asset.category} onChange={e=>setAsset({...asset,category:e.target.value})}>{["decision","camera","battery","switching","trust","service","showroom","offer","owner","referral","other"].map(x=><option key={x}>{x}</option>)}</select></Field>
              <Field label="Barrier"><select style={input} value={asset.purchase_barrier} onChange={e=>setAsset({...asset,purchase_barrier:e.target.value})}>{barriers.map(x=><option key={x}>{x}</option>)}</select></Field>
              <Field label="WhatsApp micro-copy"><textarea style={{...input,minHeight:120}} value={asset.body} onChange={e=>setAsset({...asset,body:e.target.value})}/></Field>
              <Field label="Asset URL"><input style={input} value={asset.asset_url} onChange={e=>setAsset({...asset,asset_url:e.target.value})}/></Field>
            </div>
            <button style={{...primary,marginTop:12}} disabled={!asset.content_code||!asset.title||!!busy} onClick={()=>void createAsset()}>Save content</button>
          </section>
          <section style={{...box,padding:18}}>
            <h3 style={{marginTop:0}}>Objection Library</h3>
            <div style={{display:"grid",gap:10}}>{(data?.content||[]).map(x=><div key={x.id} style={{border:"1px solid #e5e7eb",borderRadius:12,padding:13}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:12}}><b>{x.content_code} · {x.title}</b><span style={{fontSize:11,color:"#6b7280"}}>{x.category}</span></div>
              {x.purchase_barrier?<div style={{fontSize:11,color:"#008254",marginTop:4}}>Barrier: {x.purchase_barrier}</div>:null}
              {x.body?<div style={{fontSize:12,lineHeight:1.55,whiteSpace:"pre-wrap",marginTop:8}}>{x.body}</div>:null}
              {x.asset_url?<a href={x.asset_url} target="_blank" style={{fontSize:12}}>Open asset</a>:null}
            </div>)}</div>
          </section>
        </div>:null}

        {tab==="showroom"?<div style={{display:"grid",gap:18}}>
          <section style={{...box,padding:18}}>
            <h3 style={{marginTop:0}}>Create showroom appointment</h3>
            <div style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 2fr auto",gap:10,alignItems:"end"}}>
              <Field label="Customer"><select style={input} value={appt.customer_id} onChange={e=>setAppt({...appt,customer_id:e.target.value})}><option value="">Select…</option>{customers.map(c=><option key={c.id} value={c.id}>{c.full_name} · {c.product_interest_text||""}</option>)}</select></Field>
              <Field label="Date & time"><input style={input} type="datetime-local" value={appt.appointment_at} onChange={e=>setAppt({...appt,appointment_at:e.target.value})}/></Field>
              <Field label="Purpose"><input style={input} value={appt.purpose} onChange={e=>setAppt({...appt,purpose:e.target.value})}/></Field>
              <button style={primary} disabled={!appt.customer_id||!!busy} onClick={()=>void createAppointment()}>Book</button>
            </div>
          </section>
          <section style={{...box,padding:18}}>
            <h3 style={{marginTop:0}}>Appointments</h3>
            {(data?.appointments||[]).map(a=><div key={a.id} style={{display:"grid",gridTemplateColumns:"180px 1fr 140px",gap:12,padding:"11px 0",borderTop:"1px solid #eef0f2"}}>
              <b>{new Date(a.appointment_at).toLocaleString()}</b><span>{byId[a.customer_id]?.full_name||a.customer_id} · {a.purpose||""}</span><span>{a.status}</span>
            </div>)}
          </section>
        </div>:null}

        {tab==="orders"?<div style={{display:"grid",gap:18}}>
          <section style={{...box,padding:18}}>
            <h3 style={{marginTop:0}}>Manual order import</h3>
            <p style={{fontSize:12,color:"#6b7280"}}>Upload CSV/TSV exported from Excel. Flexible headers include Order Number, Customer Name, Email, Phone, Product Name, Amount, Date.</p>
            <div style={{display:"flex",gap:10,alignItems:"center"}}><input type="file" accept=".csv,.txt,.tsv,text/csv" onChange={e=>setOrderFile(e.target.files?.[0]||null)}/><button style={primary} disabled={!orderFile||!!busy} onClick={()=>void uploadOrders()}>Upload & match</button></div>
          </section>
          <section style={{...box,overflow:"auto"}}>
            <div style={{padding:18}}><h3 style={{margin:0}}>Orders requiring review</h3></div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,minWidth:1000}}>
              <thead><tr style={{background:"#f7f8fa",textAlign:"left",color:"#6b7280"}}>{["Order","Buyer","Product","Amount","Match","Assign customer","Action"].map(x=><th key={x} style={{padding:11}}>{x}</th>)}</tr></thead>
              <tbody>{unmatched.map(o=><tr key={o.id} style={{borderTop:"1px solid #eef0f2"}}>
                <td style={{padding:11,fontWeight:800}}>{o.order_number}</td>
                <td style={{padding:11}}>{o.customer_name||"—"}<div style={{color:"#6b7280"}}>{o.email||o.phone||""}</div></td>
                <td style={{padding:11}}>{o.product_name||"—"}</td>
                <td style={{padding:11}}>{new Intl.NumberFormat("de-AT",{style:"currency",currency:o.currency||"EUR"}).format(Number(o.gross_amount||0))}</td>
                <td style={{padding:11}}><b>{o.match_status}</b><div style={{color:"#6b7280"}}>{o.match_score}% · {o.match_reason||""}</div></td>
                <td style={{padding:11}}><select style={{...input,minWidth:220}} value={manualMatches[o.id]||""} onChange={e=>setManualMatches({...manualMatches,[o.id]:e.target.value})}><option value="">Select customer…</option>{customers.map(c=><option key={c.id} value={c.id}>{c.full_name} · {c.whatsapp||c.email||""}</option>)}</select></td>
                <td style={{padding:11}}><button style={primary} disabled={!manualMatches[o.id]||busy===o.id} onClick={()=>void matchOrder(o.id)}>Match</button></td>
              </tr>)}
              {!unmatched.length?<tr><td colSpan={7} style={{padding:22,color:"#6b7280"}}>No orders require review.</td></tr>:null}</tbody>
            </table>
          </section>
        </div>:null}
      </main>
    </div>
  </div>
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label style={{display:"grid",gap:5,fontSize:11,fontWeight:800,color:"#59606b"}}><span>{label}</span>{children}</label>}
function ActionCard({a,customer,busy,onDone}:{a:ActionRow;customer?:Customer;busy:string;onDone:(id:string)=>Promise<void>}){
  const overdue=new Date(a.due_at).getTime()<Date.now();
  return <div style={{display:"grid",gridTemplateColumns:"1.3fr 2fr 180px auto auto",gap:12,alignItems:"center",padding:"11px 0",borderTop:"1px solid #eef0f2"}}>
    <div><b>{customer?.full_name||"Unknown"}</b><div style={{fontSize:11,color:"#6b7280"}}>{customer?.product_interest_text||""}</div></div>
    <div>{a.title}<div style={{fontSize:11,color:a.priority==="high"?"#b42318":"#6b7280"}}>{a.priority}</div></div>
    <div style={{color:overdue?"#b42318":"#374151",fontWeight:overdue?800:500}}>{new Date(a.due_at).toLocaleString()}</div>
    {customer?.whatsapp?<a href={waLink(customer.whatsapp)} target="_blank" style={{...secondary,textDecoration:"none"}}>WhatsApp</a>:<span/>}
    <button style={primary} disabled={busy===a.id} onClick={()=>void onDone(a.id)}>Done</button>
  </div>
}
