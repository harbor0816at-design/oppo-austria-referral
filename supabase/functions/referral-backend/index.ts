import { createClient } from 'npm:@supabase/supabase-js@2.117.1'

const url = Deno.env.get('SUPABASE_URL')!
const pubKeys = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}')
const secretKeys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}')
const publishable = pubKeys.default || Deno.env.get('SUPABASE_ANON_KEY')!
const secret = secretKeys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const admin = createClient(url, secret, { auth: { autoRefreshToken: false, persistSession: false } })

const allowed: Record<string,string[]> = {
  clicked:['registered','rejected','cancelled'], registered:['pending','qualified','rejected','cancelled'],
  pending:['qualified','rejected','cancelled'], qualified:['rewarded','cancelled'], rewarded:['cancelled'], rejected:[], cancelled:[]
}
const codeAlphabet='ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json','cache-control':'no-store'}})
function maskEmail(email?:string|null){if(!email)return null;const [local,domain]=email.toLowerCase().split('@');if(!domain)return null;return `${local.slice(0,1)}***@${domain}`}
function makeCode(){const b=crypto.getRandomValues(new Uint8Array(7));return Array.from(b,x=>codeAlphabet[x%codeAlphabet.length]).join('')}
function normalizeCode(v:string){return v.trim().toUpperCase().replace(/[^A-Z0-9]/g,'')}
function normalizeIban(v:string){return v.toUpperCase().replace(/\s+/g,'')}
function maskIban(v?:string|null){if(!v)return null;const x=normalizeIban(v);return x.length>8?`${x.slice(0,4)} **** **** ${x.slice(-4)}`:x}
function validIban(v:string){
  const iban=normalizeIban(v)
  if(!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(iban))return false
  const moved=iban.slice(4)+iban.slice(0,4)
  let mod=0
  for(const ch of moved){
    const part=/[A-Z]/.test(ch)?String(ch.charCodeAt(0)-55):ch
    for(const d of part)mod=(mod*10+Number(d))%97
  }
  return mod===1
}

async function authenticated(req:Request){
  const h=req.headers.get('authorization')||''
  if(!h.startsWith('Bearer '))return null
  const token=h.slice(7)
  const client=createClient(url,publishable,{global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}})
  const {data,error}=await client.auth.getUser(token)
  if(error||!data.user)return null
  return {user:data.user,client}
}
async function getOrCreateReferrer(userId:string){
  const ex=await admin.from('referrers').select('*').eq('user_id',userId).maybeSingle();if(ex.error)throw ex.error;if(ex.data)return ex.data
  for(let i=0;i<10;i++){const c=makeCode();const x=await admin.from('referrers').insert({user_id:userId,referral_code:c,referral_slug:c.toLowerCase(),referral_link:`/r/${c}`}).select('*').single();if(!x.error)return x.data;if(x.error.code!=='23505')throw x.error}
  throw new Error('REFERRAL_CODE_ALLOCATION_FAILED')
}
async function recalc(referrerId:string){
  const r=await admin.from('referrers').select('id,user_id').eq('id',referrerId).single();if(r.error)throw r.error
  const refs=await admin.from('referrals').select('status').eq('referrer_id',referrerId);if(refs.error)throw refs.error
  const successful=(refs.data||[]).filter(x=>['qualified','rewarded'].includes(x.status)).length
  const pending=(refs.data||[]).filter(x=>['registered','pending'].includes(x.status)).length
  const rw=await admin.from('rewards').select('reward_amount,status').eq('user_id',r.data.user_id).not('status','in','(cancelled,expired)');if(rw.error)throw rw.error
  const total=(rw.data||[]).reduce((s,x)=>s+Number(x.reward_amount||0),0)
  const tiers=await admin.from('referral_tiers').select('name,minimum_referrals').eq('active',true).lte('minimum_referrals',successful).order('minimum_referrals',{ascending:false}).limit(1);if(tiers.error)throw tiers.error
  const u=await admin.from('referrers').update({successful_referrals:successful,pending_referrals:pending,total_reward_amount:total,current_tier:tiers.data?.[0]?.name||'Member',updated_at:new Date().toISOString()}).eq('id',referrerId).select('*').single();if(u.error)throw u.error;return u.data
}
async function qualify(referralId:string){
  const ref=await admin.from('referrals').select('id,referrer_id,referred_user_id,status,product_id,order_number').eq('id',referralId).single();if(ref.error)throw ref.error
  const rr=await admin.from('referrers').select('user_id').eq('id',ref.data.referrer_id).single();if(rr.error)throw rr.error
  const now=new Date().toISOString();const rule=await admin.from('referral_rules').select('*').eq('active',true).lte('valid_from',now).or(`valid_until.is.null,valid_until.gte.${now}`).order('valid_from',{ascending:false}).limit(1).maybeSingle();if(rule.error)throw rule.error;if(!rule.data)throw new Error('NO_ACTIVE_REFERRAL_RULE')
  let referrerReward=Number(rule.data.referrer_reward||0),friendReward=Number(rule.data.friend_reward||0),currency=rule.data.currency
  if(ref.data.product_id){const pr=await admin.from('referral_products').select('referrer_reward,friend_discount,currency').eq('id',ref.data.product_id).maybeSingle();if(pr.error)throw pr.error;if(pr.data){referrerReward=Number(pr.data.referrer_reward||0);friendReward=Number(pr.data.friend_discount||0);currency=pr.data.currency}}
  const a=await admin.from('rewards').upsert({user_id:rr.data.user_id,referral_id:referralId,product_id:ref.data.product_id||null,reward_type:'store_credit',reward_amount:referrerReward,currency,status:'available',approved_at:now},{onConflict:'referral_id,user_id,reward_type',ignoreDuplicates:true});if(a.error)throw a.error
  if(ref.data.referred_user_id){const b=await admin.from('rewards').upsert({user_id:ref.data.referred_user_id,referral_id:referralId,product_id:ref.data.product_id||null,reward_type:'coupon',reward_amount:friendReward,currency,status:'available',approved_at:now},{onConflict:'referral_id,user_id,reward_type',ignoreDuplicates:true});if(b.error)throw b.error}
}

Deno.serve(async(req)=>{
  if(req.method!=='POST')return json({success:false,error:{code:'METHOD_NOT_ALLOWED'}},405)
  try{
    const body=await req.json().catch(()=>({})) as any;const action=String(body.action||'');const p=body.payload||{}
    if(action==='track_click'){
      const code=normalizeCode(String(p.code||''));const sessionId=String(p.sessionId||'');if(!code||!sessionId)return json({success:false,error:{code:'VALIDATION_ERROR'}},422)
      const rf=await admin.from('referrers').select('id,referral_code').ilike('referral_code',code).maybeSingle();if(rf.error)throw rf.error;if(!rf.data)return json({success:true,data:null})
      const ex=await admin.from('referrals').select('id').eq('visitor_session_id',sessionId).eq('referrer_id',rf.data.id).maybeSingle();if(ex.error)throw ex.error
      if(!ex.data){const ins=await admin.from('referrals').insert({referrer_id:rf.data.id,referral_code:rf.data.referral_code,visitor_session_id:sessionId,status:'clicked',source:p.source||'referral_link',utm_source:p.utm_source||null,utm_medium:p.utm_medium||null,utm_campaign:p.utm_campaign||null});if(ins.error)throw ins.error}
      return json({success:true,data:{referralCode:rf.data.referral_code}})
    }

    const auth=await authenticated(req);if(!auth)return json({success:false,error:{code:'UNAUTHORIZED'}},401);const user=auth.user
    if(action==='get_or_create_referrer'||action==='dashboard'){
      const rf=await getOrCreateReferrer(user.id)
      if(action==='get_or_create_referrer')return json({success:true,data:{referralCode:rf.referral_code,referralPath:`/r/${rf.referral_code}`}})
      const rws=await admin.from('rewards').select('reward_amount,status').eq('user_id',user.id);if(rws.error)throw rws.error
      const available=(rws.data||[]).filter(x=>['approved','available'].includes(x.status)).reduce((s,x)=>s+Number(x.reward_amount||0),0)
      return json({success:true,data:{referralCode:rf.referral_code,referralPath:`/r/${rf.referral_code}`,successfulReferrals:rf.successful_referrals,pendingReferrals:rf.pending_referrals,currentTier:rf.current_tier,availableReward:available,totalRewardAmount:Number(rf.total_reward_amount||0)}})
    }
    if(action==='list_referrals'){
      const rf=await getOrCreateReferrer(user.id);let q=admin.from('referrals').select('id,status,created_at,registered_at,qualified_at,referred_email,source,product_id,order_number,referral_products(model_name,variant)').eq('referrer_id',rf.id).order('created_at',{ascending:false});if(p.status)q=q.eq('status',p.status);const rows=await q;if(rows.error)throw rows.error
      const ids=(rows.data||[]).map(x=>x.id);const rw=ids.length?await admin.from('rewards').select('referral_id,reward_amount,status').in('referral_id',ids).eq('user_id',user.id):{data:[],error:null} as any;if(rw.error)throw rw.error
      const m=new Map((rw.data||[]).map((x:any)=>[x.referral_id,x]));return json({success:true,data:(rows.data||[]).map(x=>({id:x.id,status:x.status,createdAt:x.created_at,registeredAt:x.registered_at,qualifiedAt:x.qualified_at,referredEmail:maskEmail(x.referred_email),source:x.source,productId:x.product_id,productName:x.referral_products?[x.referral_products.model_name,x.referral_products.variant].filter(Boolean).join(' · '):null,orderNumber:x.order_number,reward:Number((m.get(x.id) as any)?.reward_amount||0),rewardStatus:(m.get(x.id) as any)?.status||null}))})
    }
    if(action==='member_program_data'){
      const products=await admin.from('referral_products').select('id,sku,model_name,variant,retail_price,currency,referrer_reward,friend_discount,product_url,image_url,copy_de,copy_en,copy_zh,sort_order').eq('active',true).order('sort_order',{ascending:true});if(products.error)throw products.error
      const assets=await admin.from('marketing_assets').select('id,product_id,asset_type,title_de,title_en,title_zh,copy_de,copy_en,copy_zh,asset_url,sort_order').eq('active',true).order('sort_order',{ascending:true});if(assets.error)throw assets.error
      const settings=await admin.from('referral_program_settings').select('key,value');if(settings.error)throw settings.error
      return json({success:true,data:{products:products.data||[],assets:assets.data||[],settings:Object.fromEntries((settings.data||[]).map((x:any)=>[x.key,x.value]))}})
    }
    if(action==='attribute_registration'){
      const sessionId=p.sessionId?String(p.sessionId):'';const referralCode=p.referralCode?String(p.referralCode):'';if(!sessionId&&!referralCode)return json({success:true,data:null})
      let q=admin.from('referrals').select('id,referrer_id,status,visitor_session_id,referral_code');q=sessionId?q.eq('visitor_session_id',sessionId):q.ilike('referral_code',normalizeCode(referralCode));const f=await q.order('created_at',{ascending:false}).limit(1).maybeSingle();if(f.error)throw f.error;if(!f.data)return json({success:true,data:null})
      const rr=await admin.from('referrers').select('user_id').eq('id',f.data.referrer_id).single();if(rr.error)throw rr.error;const rp=await admin.from('profiles').select('email').eq('id',rr.data.user_id).single();if(rp.error)throw rp.error
      const email=(user.email||'').trim().toLowerCase();const self=rr.data.user_id===user.id||rp.data.email.trim().toLowerCase()===email;const dup=await admin.from('referrals').select('id').eq('referrer_id',f.data.referrer_id).eq('referred_user_id',user.id).neq('id',f.data.id).limit(1);if(dup.error)throw dup.error
      const now=new Date().toISOString();const patch=self?{referred_email:email,referred_user_id:user.id,status:'rejected',rejection_reason:'self_referral',registered_at:now,fraud_status:'blocked',fraud_reason:'self_referral'}:dup.data?.length?{referred_email:email,referred_user_id:user.id,status:'rejected',rejection_reason:'duplicate_referral',registered_at:now,fraud_status:'review',fraud_reason:'duplicate_referral'}:{referred_email:email,referred_user_id:user.id,status:'registered',registered_at:now}
      const u=await admin.from('referrals').update(patch).eq('id',f.data.id).select('*').single();if(u.error)throw u.error;await recalc(f.data.referrer_id);return json({success:true,data:u.data})
    }
    if(action==='log_consent'){
      const x=await admin.from('consent_logs').insert({user_id:user.id,consent_type:String(p.consentType||'referral_terms'),consent_version:String(p.consentVersion||'v1'),granted:p.granted!==false});if(x.error&&x.error.code!=='23505')throw x.error;return json({success:true,data:{logged:true}})
    }
    if(action==='member_get_payout'){
      const account=await admin.from('payout_accounts').select('id,account_holder,iban,bic,country,updated_at').eq('user_id',user.id).maybeSingle();if(account.error)throw account.error
      const requests=await admin.from('payout_requests').select('id,amount,currency,payout_method,status,requested_at,approved_at,paid_at,rejected_at,admin_note').eq('user_id',user.id).order('requested_at',{ascending:false}).limit(100);if(requests.error)throw requests.error
      const rewards=await admin.from('rewards').select('id,reward_amount,currency,status').eq('user_id',user.id).in('status',['approved','available']);if(rewards.error)throw rewards.error
      const activeReq=await admin.from('payout_requests').select('id').eq('user_id',user.id).in('status',['requested','approved']);if(activeReq.error)throw activeReq.error
      const activeIds=(activeReq.data||[]).map((x:any)=>x.id)
      let reservedIds=new Set<string>()
      if(activeIds.length){const links=await admin.from('payout_request_rewards').select('reward_id').in('payout_request_id',activeIds);if(links.error)throw links.error;reservedIds=new Set((links.data||[]).map((x:any)=>x.reward_id))}
      const eligible=(rewards.data||[]).filter((x:any)=>!reservedIds.has(x.id))
      const withdrawable=eligible.reduce((s:number,x:any)=>s+Number(x.reward_amount||0),0)
      return json({success:true,data:{
        account:account.data?{id:account.data.id,accountHolder:account.data.account_holder,ibanMasked:maskIban(account.data.iban),bic:account.data.bic,country:account.data.country,updatedAt:account.data.updated_at}:null,
        withdrawable,
        requests:requests.data||[]
      }})
    }
    if(action==='member_save_payout_account'){
      const existing=await admin.from('payout_accounts').select('*').eq('user_id',user.id).maybeSingle();if(existing.error)throw existing.error
      const holder=String(p.accountHolder||existing.data?.account_holder||'').trim()
      const candidate=String(p.iban||'').trim()
      const iban=normalizeIban(candidate||existing.data?.iban||'')
      const bic=String(p.bic??existing.data?.bic??'').toUpperCase().replace(/\s+/g,'').trim()||null
      if(holder.length<2||!validIban(iban))return json({success:false,error:{code:'VALIDATION_ERROR',message:'Invalid account holder or IBAN'}},422)
      if(bic&&!/^[A-Z0-9]{8}([A-Z0-9]{3})?$/.test(bic))return json({success:false,error:{code:'VALIDATION_ERROR',message:'Invalid BIC'}},422)
      const row={user_id:user.id,account_holder:holder,iban,bic,country:String(p.country||existing.data?.country||iban.slice(0,2)||'AT').slice(0,2).toUpperCase(),updated_at:new Date().toISOString()}
      const saved=await admin.from('payout_accounts').upsert(row,{onConflict:'user_id'}).select('id,account_holder,iban,bic,country,updated_at').single();if(saved.error)throw saved.error
      await admin.from('audit_logs').insert({admin_user_id:user.id,action:'payout_account.update',entity_type:'payout_account',entity_id:saved.data.id,new_value:{account_holder:saved.data.account_holder,iban_masked:maskIban(saved.data.iban),bic:saved.data.bic}})
      return json({success:true,data:{id:saved.data.id,accountHolder:saved.data.account_holder,ibanMasked:maskIban(saved.data.iban),bic:saved.data.bic,country:saved.data.country,updatedAt:saved.data.updated_at}})
    }
    if(action==='member_create_payout_request'){
      const account=await admin.from('payout_accounts').select('id').eq('user_id',user.id).maybeSingle();if(account.error)throw account.error;if(!account.data)return json({success:false,error:{code:'PAYOUT_ACCOUNT_REQUIRED',message:'Bank account required'}},409)
      const activeReq=await admin.from('payout_requests').select('id').eq('user_id',user.id).in('status',['requested','approved']);if(activeReq.error)throw activeReq.error
      const activeIds=(activeReq.data||[]).map((x:any)=>x.id)
      let reservedIds=new Set<string>()
      if(activeIds.length){const links=await admin.from('payout_request_rewards').select('reward_id').in('payout_request_id',activeIds);if(links.error)throw links.error;reservedIds=new Set((links.data||[]).map((x:any)=>x.reward_id))}
      const rewards=await admin.from('rewards').select('id,reward_amount,currency,status').eq('user_id',user.id).in('status',['approved','available']).order('created_at',{ascending:true});if(rewards.error)throw rewards.error
      const eligible=(rewards.data||[]).filter((x:any)=>!reservedIds.has(x.id))
      const amount=eligible.reduce((s:number,x:any)=>s+Number(x.reward_amount||0),0)
      if(amount<=0)return json({success:false,error:{code:'NO_WITHDRAWABLE_BALANCE',message:'No withdrawable balance'}},409)
      const currency=String(eligible[0]?.currency||'EUR')
      const created=await admin.from('payout_requests').insert({user_id:user.id,amount,currency,payout_method:'bank_transfer',payout_account_id:account.data.id,status:'requested'}).select('*').single();if(created.error)throw created.error
      const linkRows=eligible.map((x:any)=>({payout_request_id:created.data.id,reward_id:x.id,amount:Number(x.reward_amount||0)}))
      if(linkRows.length){const links=await admin.from('payout_request_rewards').insert(linkRows);if(links.error)throw links.error}
      await admin.from('audit_logs').insert({admin_user_id:user.id,action:'payout.request',entity_type:'payout_request',entity_id:created.data.id,new_value:{amount,currency,status:'requested'}})
      return json({success:true,data:created.data},201)
    }

    const role=String(user.app_metadata?.role||'');const isAdmin=['admin','super_admin'].includes(role);if(!isAdmin)return json({success:false,error:{code:'FORBIDDEN'}},403)
    if(action==='admin_list_admins'){
      if(role!=='super_admin')return json({success:false,error:{code:'FORBIDDEN'}},403)
      const listed=await admin.auth.admin.listUsers({page:1,perPage:1000});if(listed.error)throw listed.error
      const rows=(listed.data.users||[]).filter((u:any)=>['admin','super_admin'].includes(String(u.app_metadata?.role||''))).map((u:any)=>({id:u.id,email:u.email,role:u.app_metadata?.role||'admin',created_at:u.created_at,last_sign_in_at:u.last_sign_in_at||null}))
      return json({success:true,data:rows})
    }
    if(action==='superadmin_create_admin'){
      if(role!=='super_admin')return json({success:false,error:{code:'FORBIDDEN'}},403)
      const email=String(p.email||'').trim().toLowerCase();const password=String(p.password||'');const firstName=String(p.firstName||'').trim();const lastName=String(p.lastName||'').trim()
      if(!/^\\S+@\\S+\\.\\S+$/.test(email)||password.length<12)return json({success:false,error:{code:'VALIDATION_ERROR',message:'Valid email and password of at least 12 characters required'}},422)
      const created=await admin.auth.admin.createUser({email,password,email_confirm:true,app_metadata:{role:'admin'},user_metadata:{first_name:firstName,last_name:lastName,country:'AT',language:'de'}});if(created.error)throw created.error
      const u=created.data.user
      await admin.from('profiles').upsert({id:u.id,email:u.email,first_name:firstName||null,last_name:lastName||null,country:'AT',language:'de',status:'active',updated_at:new Date().toISOString()},{onConflict:'id'})
      await admin.from('audit_logs').insert({admin_user_id:user.id,action:'admin.create',entity_type:'auth_user',entity_id:u.id,new_value:{email:u.email,role:'admin'}})
      return json({success:true,data:{id:u.id,email:u.email,role:'admin',created_at:u.created_at}})
    }
    if(action==='admin_list_payouts'){
      const reqs=await admin.from('payout_requests').select('*').order('requested_at',{ascending:false}).limit(1000);if(reqs.error)throw reqs.error
      const userIds=[...new Set((reqs.data||[]).map((x:any)=>x.user_id))]
      const accountIds=[...new Set((reqs.data||[]).map((x:any)=>x.payout_account_id).filter(Boolean))]
      const profiles=userIds.length?await admin.from('profiles').select('id,email,first_name,last_name').in('id',userIds):{data:[],error:null} as any;if(profiles.error)throw profiles.error
      const accounts=accountIds.length?await admin.from('payout_accounts').select('id,account_holder,iban,bic').in('id',accountIds):{data:[],error:null} as any;if(accounts.error)throw accounts.error
      const pm=new Map((profiles.data||[]).map((x:any)=>[x.id,x])),am=new Map((accounts.data||[]).map((x:any)=>[x.id,x]))
      return json({success:true,data:(reqs.data||[]).map((x:any)=>{const p0:any=pm.get(x.user_id)||{},a:any=am.get(x.payout_account_id)||{};return {...x,email:p0.email||null,name:[p0.first_name,p0.last_name].filter(Boolean).join(' '),account_holder:a.account_holder||null,iban_masked:maskIban(a.iban),bic:a.bic||null}})})
    }
    if(action==='admin_get_payout_detail'){
      const id=String(p.id||'');const req0=await admin.from('payout_requests').select('*').eq('id',id).single();if(req0.error)throw req0.error
      const acc=req0.data.payout_account_id?await admin.from('payout_accounts').select('account_holder,iban,bic,country').eq('id',req0.data.payout_account_id).single():{data:null,error:null} as any;if(acc.error)throw acc.error
      const prof=await admin.from('profiles').select('email,first_name,last_name').eq('id',req0.data.user_id).maybeSingle();if(prof.error)throw prof.error
      return json({success:true,data:{...req0.data,email:prof.data?.email||null,name:[prof.data?.first_name,prof.data?.last_name].filter(Boolean).join(' '),bank:acc.data}})
    }
    if(action==='admin_update_payout'){
      const id=String(p.id||''),next=String(p.status||''),note=String(p.adminNote||'').trim()||null
      const cur=await admin.from('payout_requests').select('*').eq('id',id).single();if(cur.error)throw cur.error
      const allowedPayout:Record<string,string[]>={requested:['approved','rejected','cancelled'],approved:['paid','rejected','cancelled'],paid:[],rejected:[],cancelled:[]}
      if(cur.data.status!==next&&!allowedPayout[cur.data.status]?.includes(next))return json({success:false,error:{code:'INVALID_STATUS_TRANSITION',message:'Invalid payout status transition'}},409)
      const now=new Date().toISOString();const patch:any={status:next,admin_note:note,updated_at:now}
      if(next==='approved')patch.approved_at=now
      if(next==='paid')patch.paid_at=now
      if(next==='rejected')patch.rejected_at=now
      const upd=await admin.from('payout_requests').update(patch).eq('id',id).select('*').single();if(upd.error)throw upd.error
      if(next==='paid'){
        const links=await admin.from('payout_request_rewards').select('reward_id').eq('payout_request_id',id);if(links.error)throw links.error
        const ids=(links.data||[]).map((x:any)=>x.reward_id)
        if(ids.length){const rw=await admin.from('rewards').update({status:'redeemed',redeemed_at:now}).in('id',ids).in('status',['approved','available']);if(rw.error)throw rw.error}
      }
      await admin.from('audit_logs').insert({admin_user_id:user.id,action:'payout.status_update',entity_type:'payout_request',entity_id:id,old_value:cur.data,new_value:upd.data})
      return json({success:true,data:upd.data})
    }
    if(action==='admin_program_snapshot'){
      const products=await admin.from('referral_products').select('*').order('sort_order',{ascending:true});if(products.error)throw products.error
      const assets=await admin.from('marketing_assets').select('*').order('sort_order',{ascending:true});if(assets.error)throw assets.error
      const sales=await admin.from('referral_sales').select('*,referral_products(model_name,variant),referrals(referral_code,referred_email)').order('created_at',{ascending:false}).limit(1000);if(sales.error)throw sales.error
      const settings=await admin.from('referral_program_settings').select('key,value,updated_at');if(settings.error)throw settings.error
      return json({success:true,data:{products:products.data||[],assets:assets.data||[],sales:sales.data||[],settings:Object.fromEntries((settings.data||[]).map((x:any)=>[x.key,x.value]))}})
    }
    if(action==='admin_save_product'){
      const d=p.product||{};const row:any={
        sku:d.sku||null,model_name:String(d.model_name||'').trim(),variant:d.variant||null,
        retail_price:d.retail_price===null||d.retail_price===''?null:Number(d.retail_price),
        currency:String(d.currency||'EUR').slice(0,3).toUpperCase(),
        referrer_reward:Number(d.referrer_reward||0),friend_discount:Number(d.friend_discount||0),
        product_url:d.product_url||null,image_url:d.image_url||null,
        copy_de:d.copy_de||null,copy_en:d.copy_en||null,copy_zh:d.copy_zh||null,
        active:d.active!==false,sort_order:Number(d.sort_order||0),updated_at:new Date().toISOString()
      };if(!row.model_name)return json({success:false,error:{code:'VALIDATION_ERROR',message:'model_name required'}},422)
      let q=d.id?admin.from('referral_products').update(row).eq('id',String(d.id)):admin.from('referral_products').insert(row);const x=await q.select('*').single();if(x.error)throw x.error
      await admin.from('audit_logs').insert({admin_user_id:user.id,action:'product.save',entity_type:'referral_product',entity_id:x.data.id,new_value:x.data});return json({success:true,data:x.data})
    }
    if(action==='admin_save_asset'){
      const d=p.asset||{};const row:any={
        product_id:d.product_id||null,asset_type:d.asset_type||'copy',
        title_de:String(d.title_de||'').trim(),title_en:d.title_en||null,title_zh:d.title_zh||null,
        copy_de:d.copy_de||null,copy_en:d.copy_en||null,copy_zh:d.copy_zh||null,
        asset_url:d.asset_url||null,active:d.active!==false,sort_order:Number(d.sort_order||0),updated_at:new Date().toISOString()
      };if(!row.title_de)return json({success:false,error:{code:'VALIDATION_ERROR',message:'title_de required'}},422)
      let q=d.id?admin.from('marketing_assets').update(row).eq('id',String(d.id)):admin.from('marketing_assets').insert(row);const x=await q.select('*').single();if(x.error)throw x.error
      await admin.from('audit_logs').insert({admin_user_id:user.id,action:'asset.save',entity_type:'marketing_asset',entity_id:x.data.id,new_value:x.data});return json({success:true,data:x.data})
    }
    if(action==='admin_save_settings'){
      const key=String(p.key||'program');const value=p.value||{};const x=await admin.from('referral_program_settings').upsert({key,value,updated_at:new Date().toISOString()},{onConflict:'key'}).select('*').single();if(x.error)throw x.error
      return json({success:true,data:x.data})
    }
    if(action==='admin_save_sale'){
      const d=p.sale||{};let referrerId=d.referrer_id||null
      if(d.referral_id&&!referrerId){const rr=await admin.from('referrals').select('referrer_id').eq('id',String(d.referral_id)).single();if(rr.error)throw rr.error;referrerId=rr.data.referrer_id}
      let rewardAmount=Number(d.reward_amount||0)
      if(d.product_id&&!rewardAmount){const pr=await admin.from('referral_products').select('referrer_reward').eq('id',String(d.product_id)).maybeSingle();if(pr.error)throw pr.error;if(pr.data)rewardAmount=Number(pr.data.referrer_reward||0)}
      const row:any={
        order_number:d.order_number||null,referral_id:d.referral_id||null,referrer_id:referrerId,
        product_id:d.product_id||null,quantity:Number(d.quantity||1),gross_sales:Number(d.gross_sales||0),
        net_sales:Number(d.net_sales||0),reward_amount:rewardAmount,currency:String(d.currency||'EUR').slice(0,3).toUpperCase(),
        status:d.status||'pending',sold_at:d.sold_at||null,notes:d.notes||null,updated_at:new Date().toISOString()
      }
      let q=d.id?admin.from('referral_sales').update(row).eq('id',String(d.id)):admin.from('referral_sales').insert(row);const x=await q.select('*').single();if(x.error)throw x.error
      if(row.referral_id){
        const ref=await admin.from('referrals').select('id,referrer_id,status').eq('id',row.referral_id).single();if(ref.error)throw ref.error
        if(row.status==='confirmed'){
          const patch:any={product_id:row.product_id||null,order_number:row.order_number||null,status:'qualified',qualified_at:new Date().toISOString()}
          const ur=await admin.from('referrals').update(patch).eq('id',row.referral_id);if(ur.error)throw ur.error;await qualify(row.referral_id);await recalc(ref.data.referrer_id)
        } else if(['cancelled','returned'].includes(row.status) && ['registered','pending','qualified','rewarded'].includes(ref.data.status)){
          const ur=await admin.from('referrals').update({status:'cancelled',rejection_reason:row.status}).eq('id',row.referral_id);if(ur.error)throw ur.error
          const rw=await admin.from('rewards').update({status:'cancelled'}).eq('referral_id',row.referral_id).in('status',['pending','approved','available']);if(rw.error)throw rw.error;await recalc(ref.data.referrer_id)
        }
      }
      await admin.from('audit_logs').insert({admin_user_id:user.id,action:'sale.save',entity_type:'referral_sale',entity_id:x.data.id,new_value:x.data});return json({success:true,data:x.data})
    }
    if(action==='admin_list_users'){const r=await admin.from('profiles').select('id,email,first_name,last_name,country,language,status,created_at').order('created_at',{ascending:false}).limit(500);if(r.error)throw r.error;return json({success:true,data:r.data})}
    if(action==='admin_list_referrals'){let q=admin.from('referrals').select('id,referrer_id,referral_code,referred_email,status,created_at,registered_at,qualified_at,rewarded_at,rejection_reason,fraud_status,fraud_reason,product_id,order_number').order('created_at',{ascending:false}).limit(1000);if(p.status)q=q.eq('status',p.status);const r=await q;if(r.error)throw r.error;return json({success:true,data:r.data})}
    if(action==='admin_list_rewards'){const r=await admin.from('rewards').select('*').order('created_at',{ascending:false}).limit(1000);if(r.error)throw r.error;return json({success:true,data:r.data})}
    if(action==='admin_update_referral'){
      const id=String(p.id||'');const next=String(p.status||'');const cur=await admin.from('referrals').select('*').eq('id',id).single();if(cur.error)throw cur.error;if(cur.data.status!==next&&!allowed[cur.data.status]?.includes(next))return json({success:false,error:{code:'INVALID_STATUS_TRANSITION'}},409)
      const patch:any={status:next};if(p.productId)patch.product_id=String(p.productId);if(p.orderNumber)patch.order_number=String(p.orderNumber);if(next==='qualified')patch.qualified_at=new Date().toISOString();if(['rejected','cancelled'].includes(next))patch.rejection_reason=p.reason||null;const changed=await admin.from('referrals').update(patch).eq('id',id).select('*').single();if(changed.error)throw changed.error
      if(next==='qualified')await qualify(id);if(['rejected','cancelled'].includes(next)){const c=await admin.from('rewards').update({status:'cancelled'}).eq('referral_id',id).in('status',['pending','approved','available']);if(c.error)throw c.error}await recalc(cur.data.referrer_id)
      const au=await admin.from('audit_logs').insert({admin_user_id:user.id,action:'referral.status_update',entity_type:'referral',entity_id:id,old_value:cur.data,new_value:changed.data});if(au.error)throw au.error;return json({success:true,data:changed.data})
    }
    if(action==='admin_update_reward'){
      const id=String(p.id||'');const status=String(p.status||'');const old=await admin.from('rewards').select('*').eq('id',id).single();if(old.error)throw old.error;const patch:any={status};if(status==='redeemed')patch.redeemed_at=new Date().toISOString();if(['approved','available'].includes(status)&&!old.data.approved_at)patch.approved_at=new Date().toISOString();const ch=await admin.from('rewards').update(patch).eq('id',id).select('*').single();if(ch.error)throw ch.error;const au=await admin.from('audit_logs').insert({admin_user_id:user.id,action:'reward.status_update',entity_type:'reward',entity_id:id,old_value:old.data,new_value:ch.data});if(au.error)throw au.error;return json({success:true,data:ch.data})
    }
    return json({success:false,error:{code:'UNKNOWN_ACTION'}},400)
  }catch(e){console.error(e);return json({success:false,error:{code:'INTERNAL_ERROR',message:e instanceof Error?e.message:String(e)}},500)}
})
