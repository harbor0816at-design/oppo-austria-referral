"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";

type Lang = "de" | "en" | "zh";
type Tab = "dashboard" | "agreements" | "referrals" | "users" | "products" | "assets" | "sales" | "payouts" | "admins" | "settings";

type Referral = {
  id: string;
  referral_code: string;
  referred_email: string | null;
  status: string;
  created_at: string;
  registered_at: string | null;
  qualified_at: string | null;
  rejection_reason: string | null;
  product_id?: string | null;
  order_number?: string | null;
};

type UserRow = {
  id: string;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  country?: string | null;
  language?: string | null;
  status: string;
  created_at: string;
};

type AdminAccount = {
  id: string;
  email: string;
  role: "admin" | "super_admin";
  created_at: string;
  last_sign_in_at?: string | null;
};

type Reward = {
  id: string;
  reward_amount: number;
  currency: string;
  status: string;
  product_id?: string | null;
};

type Product = {
  id?: string;
  sku?: string | null;
  model_name: string;
  variant?: string | null;
  retail_price?: number | null;
  currency: string;
  referrer_reward: number;
  friend_discount: number;
  product_url?: string | null;
  image_url?: string | null;
  copy_de?: string | null;
  copy_en?: string | null;
  copy_zh?: string | null;
  active: boolean;
  sort_order: number;
};

type Asset = {
  id?: string;
  product_id?: string | null;
  asset_type: "copy" | "image" | "video" | "banner" | "link";
  title_de: string;
  title_en?: string | null;
  title_zh?: string | null;
  copy_de?: string | null;
  copy_en?: string | null;
  copy_zh?: string | null;
  asset_url?: string | null;
  active: boolean;
  sort_order: number;
};

type Sale = {
  id?: string;
  order_number?: string | null;
  referral_id?: string | null;
  referrer_id?: string | null;
  product_id?: string | null;
  quantity: number;
  gross_sales: number;
  net_sales: number;
  reward_amount: number;
  currency: string;
  status: "pending" | "confirmed" | "cancelled" | "returned";
  sold_at?: string | null;
  notes?: string | null;
  referral_products?: { model_name?: string; variant?: string | null } | null;
  referrals?: { referral_code?: string; referred_email?: string | null } | null;
};

type ProgramSnapshot = {
  products: Product[];
  assets: Asset[];
  sales: Sale[];
  settings: Record<string, any>;
};

type AgreementRow = {
  id: string;
  user_id: string;
  email?: string | null;
  name?: string | null;
  template_version: string;
  signer_name: string;
  signer_email: string;
  status: string;
  signed_at: string;
  reviewed_at?: string | null;
  review_note?: string | null;
  content_hash?: string | null;
  profile_status?: string | null;
};

type AgreementDetail = AgreementRow & {
  title_snapshot: string;
  content_snapshot: string;
  signature_url: string;
};

type PayoutRow = {
  id: string;
  user_id: string;
  email?: string | null;
  name?: string | null;
  amount: number;
  currency: string;
  status: string;
  requested_at: string;
  approved_at?: string | null;
  paid_at?: string | null;
  rejected_at?: string | null;
  admin_note?: string | null;
  account_holder?: string | null;
  iban_masked?: string | null;
  bic?: string | null;
};

const copy = {
  de: {
    dashboard: "Übersicht", referrals: "Empfehlungen", users: "Nutzer", products: "Produkte & Provisionen",
    agreements: "Vereinbarungen", assets: "Werbematerial", sales: "Verkäufe", payouts: "Auszahlungen", settings: "Grundeinstellungen", logout: "Abmelden",
    usersKpi: "Nutzer", review: "Zu prüfen", qualified: "Qualifiziert", rewards: "Rewards",
    activeProducts: "Aktive Produkte", activeAssets: "Aktive Materialien", confirmedSales: "Bestätigte Verkäufe",
    refresh: "Aktualisieren", save: "Speichern", newItem: "Neu anlegen", edit: "Bearbeiten",
    email: "E-Mail", code: "Code", status: "Status", created: "Erstellt", action: "Aktion",
    product: "Produkt", order: "Bestellnummer", qualify: "Qualifizieren", reject: "Ablehnen",
    noData: "Noch keine Daten.", model: "Modell", variant: "Variante", price: "UVP",
    refReward: "Prämie Empfehlender", friendDiscount: "Vorteil Freund", active: "Aktiv", sort: "Sortierung",
    url: "Produkt-URL", image: "Bild-URL", sku: "SKU", germanCopy: "Text DE", englishCopy: "Text EN", chineseCopy: "Text 中文",
    assetType: "Typ", title: "Titel", assetUrl: "Material-URL", linkedProduct: "Produktzuordnung",
    quantity: "Menge", gross: "Bruttoumsatz", net: "Nettoumsatz", reward: "Prämie", soldAt: "Verkaufsdatum", notes: "Notiz",
    programName: "Programmname", market: "Markt", currency: "Währung", supportEmail: "Support-E-Mail",
    defaultLanguage: "Standardsprache", termsVersion: "AGB-Version", maintenance: "Programmdaten pflegen",
    reviewHelp: "Bei erfolgreicher Qualifizierung werden die Rewards automatisch nach dem gewählten Produkt berechnet.",
    productHelp: "Hier pflegen Sie die für Empfehlungen verfügbaren Modelle und die Prämie je Modell.",
    assetHelp: "Diese Inhalte stehen Empfehlenden anschließend als kopierfertige Werbemittel zur Verfügung.",
    salesHelp: "Bestätigte Verkäufe können mit einer Empfehlung und einem Produkt verknüpft werden und lösen die Prämie aus.",
  },
  en: {
    dashboard: "Dashboard", referrals: "Referrals", users: "Users", products: "Products & commissions",
    agreements: "Agreements", assets: "Marketing assets", sales: "Sales", payouts: "Payouts", settings: "Basic settings", logout: "Sign out",
    usersKpi: "Users", review: "To review", qualified: "Qualified", rewards: "Rewards",
    activeProducts: "Active products", activeAssets: "Active assets", confirmedSales: "Confirmed sales",
    refresh: "Refresh", save: "Save", newItem: "New", edit: "Edit",
    email: "Email", code: "Code", status: "Status", created: "Created", action: "Action",
    product: "Product", order: "Order number", qualify: "Qualify", reject: "Reject",
    noData: "No data yet.", model: "Model", variant: "Variant", price: "RRP",
    refReward: "Referrer reward", friendDiscount: "Friend benefit", active: "Active", sort: "Sort",
    url: "Product URL", image: "Image URL", sku: "SKU", germanCopy: "Copy DE", englishCopy: "Copy EN", chineseCopy: "Copy 中文",
    assetType: "Type", title: "Title", assetUrl: "Asset URL", linkedProduct: "Linked product",
    quantity: "Quantity", gross: "Gross sales", net: "Net sales", reward: "Reward", soldAt: "Sale date", notes: "Notes",
    programName: "Program name", market: "Market", currency: "Currency", supportEmail: "Support email",
    defaultLanguage: "Default language", termsVersion: "Terms version", maintenance: "Maintain program data",
    reviewHelp: "Qualifying a referral automatically creates rewards based on the selected product.",
    productHelp: "Maintain all models available for referral and the reward for each model.",
    assetHelp: "These items become copy-ready marketing materials for referrers.",
    salesHelp: "Confirmed sales can be linked to a referral and product and will trigger the reward.",
  },
  zh: {
    dashboard: "总览", referrals: "推荐审核", users: "用户", products: "产品与返利",
    agreements: "协议审核", assets: "宣传素材", sales: "销量结果", payouts: "提现审核", settings: "基础设置", logout: "退出登录",
    usersKpi: "用户数", review: "待审核", qualified: "已确认", rewards: "已发奖励",
    activeProducts: "在售推荐产品", activeAssets: "有效素材", confirmedSales: "已确认销量",
    refresh: "刷新", save: "保存", newItem: "新建", edit: "编辑",
    email: "邮箱", code: "推荐码", status: "状态", created: "创建时间", action: "操作",
    product: "产品", order: "订单号", qualify: "确认成交", reject: "拒绝",
    noData: "暂无数据。", model: "机型", variant: "版本", price: "零售价",
    refReward: "推荐人返利", friendDiscount: "被推荐人优惠", active: "启用", sort: "排序",
    url: "产品链接", image: "图片链接", sku: "SKU", germanCopy: "德语文案", englishCopy: "英语文案", chineseCopy: "中文文案",
    assetType: "素材类型", title: "标题", assetUrl: "素材链接", linkedProduct: "关联产品",
    quantity: "数量", gross: "销售额(含税)", net: "销售额(净额)", reward: "返利", soldAt: "销售日期", notes: "备注",
    programName: "项目名称", market: "市场", currency: "币种", supportEmail: "客服邮箱",
    defaultLanguage: "默认语言", termsVersion: "条款版本", maintenance: "项目基础信息维护",
    reviewHelp: "确认成交时会根据所选机型自动计算并生成双方奖励。",
    productHelp: "维护可推荐机型、价格以及每个机型对应的推荐返利。",
    assetHelp: "这里维护的文案、图片和链接会直接出现在推荐人端，支持一键复制。",
    salesHelp: "确认销量可关联推荐记录与机型，并自动触发对应返利。",
  },
} as const;

const box: React.CSSProperties = { background: "#fff", border: "1px solid #e3e6ea", borderRadius: 16 };
const input: React.CSSProperties = { width: "100%", border: "1px solid #d8dde3", borderRadius: 9, padding: "9px 10px", fontSize: 13, background: "#fff" };
const label: React.CSSProperties = { display: "block", fontSize: 11, color: "#69707d", marginBottom: 5, fontWeight: 700 };
const primary: React.CSSProperties = { border: 0, background: "#008254", color: "#fff", borderRadius: 9, padding: "9px 12px", cursor: "pointer", fontWeight: 700 };
const secondary: React.CSSProperties = { border: "1px solid #d1d5db", background: "#fff", color: "#121316", borderRadius: 9, padding: "9px 12px", cursor: "pointer", fontWeight: 600 };
const danger: React.CSSProperties = { border: "1px solid #fecaca", background: "#fff", color: "#b42318", borderRadius: 9, padding: "9px 12px", cursor: "pointer", fontWeight: 700 };

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "content-type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || !body.success) throw new Error(body?.error?.message || "Request failed");
  return body.data as T;
}

const emptyProduct = (): Product => ({
  model_name: "", variant: "", sku: "", retail_price: null, currency: "EUR",
  referrer_reward: 50, friend_discount: 50, product_url: "", image_url: "",
  copy_de: "", copy_en: "", copy_zh: "", active: true, sort_order: 0,
});

const emptyAsset = (): Asset => ({
  product_id: null, asset_type: "copy", title_de: "", title_en: "", title_zh: "",
  copy_de: "", copy_en: "", copy_zh: "", asset_url: "", active: true, sort_order: 0,
});

const emptySale = (): Sale => ({
  order_number: "", referral_id: null, product_id: null, quantity: 1,
  gross_sales: 0, net_sales: 0, reward_amount: 0, currency: "EUR",
  status: "pending", sold_at: new Date().toISOString().slice(0, 10), notes: "",
});

export default function AdminClient({ adminEmail, adminRole }: { adminEmail: string; adminRole: string }) {
  const [lang, setLang] = useState<Lang>("de");
  const [tab, setTab] = useState<Tab>("dashboard");
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [agreements, setAgreements] = useState<AgreementRow[]>([]);
  const [agreementDetail, setAgreementDetail] = useState<AgreementDetail | null>(null);
  const [agreementNote, setAgreementNote] = useState("");
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [adminDraft, setAdminDraft] = useState({ email: "", firstName: "", lastName: "", password: "", passwordConfirm: "" });
  const [passwordDraft, setPasswordDraft] = useState({ password: "", passwordConfirm: "" });
  const [program, setProgram] = useState<ProgramSnapshot>({ products: [], assets: [], sales: [], settings: {} });
  const [productDraft, setProductDraft] = useState<Product>(emptyProduct());
  const [assetDraft, setAssetDraft] = useState<Asset>(emptyAsset());
  const [saleDraft, setSaleDraft] = useState<Sale>(emptySale());
  const [settingsDraft, setSettingsDraft] = useState<Record<string, any>>({});
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, { productId?: string; orderNumber?: string }>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const t = copy[lang];

  const load = useCallback(async () => {
    setError("");
    try {
      const [r, u, w, p, po, ag] = await Promise.all([
        request<Referral[]>("/api/admin/referrals"),
        request<UserRow[]>("/api/admin/users"),
        request<Reward[]>("/api/admin/rewards"),
        request<ProgramSnapshot>("/api/admin/program"),
        request<PayoutRow[]>("/api/admin/payouts"),
        request<AgreementRow[]>("/api/admin/agreements"),
      ]);
      setReferrals(r);
      setUsers(u);
      setRewards(w);
      setProgram(p);
      setPayouts(po);
      setAgreements(ag);
      setSettingsDraft(p.settings?.program || {});
      if (adminRole === "super_admin") {
        const a = await request<AdminAccount[]>("/api/admin/admins");
        setAdmins(a);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }, [adminRole]);

  useEffect(() => { void load(); }, [load]);

  async function uploadAssetImage(file: File) {
    setError("");
    if (!["image/jpeg","image/png","image/webp"].includes(file.type)) {
      setError(lang === "zh" ? "仅支持 JPG、PNG、WebP 图片。" : lang === "en" ? "Only JPG, PNG and WebP images are supported." : "Nur JPG-, PNG- und WebP-Bilder werden unterstützt.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError(lang === "zh" ? "图片不能超过 8 MB。" : lang === "en" ? "Image must not exceed 8 MB." : "Das Bild darf maximal 8 MB groß sein.");
      return;
    }
    setBusy("asset-image-upload");
    try {
      const supabase = createBrowserSupabase();
      const ext = file.name.split(".").pop()?.toLowerCase() || (file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg");
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-90);
      const path = `images/${new Date().toISOString().slice(0,10)}/${crypto.randomUUID()}-${safeName || "asset." + ext}`;
      const { error: uploadError } = await supabase.storage.from("referral-assets").upload(path, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: false,
      });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("referral-assets").getPublicUrl(path);
      setAssetDraft(x => ({
        ...x,
        asset_type: x.asset_type === "banner" ? "banner" : "image",
        asset_url: data.publicUrl,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image upload failed");
    } finally {
      setBusy("");
    }
  }

  async function saveProgram(action: string, payload: any) {
    setBusy(action);
    setError("");
    try {
      await request("/api/admin/program", {
        method: "POST",
        body: JSON.stringify({ action, payload }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
      throw e;
    } finally {
      setBusy("");
    }
  }

  async function updateReferral(id: string, status: "qualified" | "rejected") {
    setBusy(id + status);
    setError("");
    try {
      const draft = reviewDrafts[id] || {};
      await request("/api/admin/referrals/" + id, {
        method: "PATCH",
        body: JSON.stringify({
          status,
          ...(status === "rejected" ? { reason: "admin_rejected" } : {}),
          ...(draft.productId ? { productId: draft.productId } : {}),
          ...(draft.orderNumber ? { orderNumber: draft.orderNumber } : {}),
        }),
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy("");
    }
  }

  async function openAgreement(id: string) {
    setError("");
    try {
      const d = await request<AgreementDetail>("/api/admin/agreements/" + id);
      setAgreementDetail(d);
      setAgreementNote(d.review_note || "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Agreement load failed");
    }
  }

  async function reviewAgreement(id: string, status: "approved" | "rejected") {
    const label = lang === "zh" ? (status === "approved" ? "确认通过该协议？" : "确认拒绝该协议？") : lang === "en" ? (status === "approved" ? "Approve this agreement?" : "Reject this agreement?") : (status === "approved" ? "Diese Vereinbarung freigeben?" : "Diese Vereinbarung ablehnen?");
    if (!window.confirm(label)) return;
    setBusy("agreement-" + id + "-" + status);
    setError("");
    try {
      await request("/api/admin/agreements/" + id, { method: "PATCH", body: JSON.stringify({ status, reviewNote: agreementNote }) });
      setAgreementDetail(null);
      setAgreementNote("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Agreement review failed");
    } finally {
      setBusy("");
    }
  }

  async function updatePayout(id: string, status: "approved" | "paid" | "rejected" | "cancelled") {
    const label = lang === "zh" ? {approved:"审核通过",paid:"标记已支付",rejected:"拒绝",cancelled:"取消"}[status] : lang === "en" ? status : {approved:"Freigeben",paid:"Als bezahlt markieren",rejected:"Ablehnen",cancelled:"Stornieren"}[status];
    if (!window.confirm(String(label) + "?")) return;
    setBusy("payout-" + id + "-" + status);
    setError("");
    try {
      await request("/api/admin/payouts/" + id, { method: "PATCH", body: JSON.stringify({ status, adminNote: "" }) });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payout update failed");
    } finally {
      setBusy("");
    }
  }

  async function showBankDetails(id: string) {
    try {
      const d = await request<any>("/api/admin/payouts/" + id);
      const b = d.bank;
      const text = b
        ? `${d.name || d.email || ""}\n${b.account_holder}\nIBAN: ${b.iban}\nBIC: ${b.bic || "—"}\n${b.country || ""}`
        : "No bank account";
      window.alert(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load bank details");
    }
  }

  async function createAdmin() {
    setBusy("create-admin");
    setError("");
    try {
      await request("/api/admin/admins", { method: "POST", body: JSON.stringify(adminDraft) });
      setAdminDraft({ email: "", firstName: "", lastName: "", password: "", passwordConfirm: "" });
      const a = await request<AdminAccount[]>("/api/admin/admins");
      setAdmins(a);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create admin failed");
    } finally {
      setBusy("");
    }
  }

  async function updateOwnPassword() {
    setBusy("password");
    setError("");
    try {
      await request("/api/auth/password", { method: "POST", body: JSON.stringify(passwordDraft) });
      setPasswordDraft({ password: "", passwordConfirm: "" });
      alert(lang === "zh" ? "密码已更新。以后请使用邮箱和新密码登录。" : lang === "en" ? "Password updated. Use email and the new password for future sign-ins." : "Passwort aktualisiert. Verwenden Sie künftig E-Mail und das neue Passwort.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Password update failed");
    } finally {
      setBusy("");
    }
  }

  async function signOut() {
    await request("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.assign("/portal/index.html");
  }

  const reviewable = referrals.filter(r => ["registered", "pending"].includes(r.status)).length;
  const qualified = referrals.filter(r => ["qualified", "rewarded"].includes(r.status)).length;
  const rewardTotal = rewards.filter(r => !["cancelled", "expired"].includes(r.status)).reduce((s, r) => s + Number(r.reward_amount || 0), 0);
  const confirmedSales = program.sales.filter(s => s.status === "confirmed").reduce((n, s) => n + Number(s.quantity || 0), 0);
  const activeProducts = program.products.filter(p => p.active);
  const activeAssets = program.assets.filter(a => a.active);

  const nav: Array<[Tab, string]> = [
    ["dashboard", t.dashboard], ["agreements", t.agreements], ["referrals", t.referrals], ["users", t.users],
    ["products", t.products], ["assets", t.assets], ["sales", t.sales], ["payouts", t.payouts],
    ...(adminRole === "super_admin" ? [["admins", lang === "zh" ? "管理员管理" : lang === "en" ? "Administrators" : "Administratoren"] as [Tab,string]] : []),
    ["settings", t.settings],
  ];

  const modelLabel = (p?: Product | null) => p ? [p.model_name, p.variant].filter(Boolean).join(" · ") : "—";
  const money = (v: number, currency = "EUR") => new Intl.NumberFormat(lang === "zh" ? "zh-CN" : lang === "en" ? "en-GB" : "de-AT", { style: "currency", currency }).format(Number(v || 0));

  function Heading({ title, help, action }: { title: string; help?: string; action?: React.ReactNode }) {
    return <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 18 }}>
      <div><h2 style={{ margin: 0, fontSize: 22 }}>{title}</h2>{help ? <p style={{ margin: "6px 0 0", color: "#69707d", fontSize: 13 }}>{help}</p> : null}</div>
      {action}
    </div>;
  }

  function Field({ name, children }: { name: string; children: React.ReactNode }) {
    return <div><label style={label}>{name}</label>{children}</div>;
  }

  const dashboard = <div style={{ display: "grid", gap: 20 }}>
    <section style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0,1fr))", gap: 12 }}>
      {[
        [t.usersKpi, users.length],
        [t.review, reviewable],
        [t.qualified, qualified],
        [t.rewards, money(rewardTotal)],
        [t.activeProducts, activeProducts.length],
        [t.activeAssets, activeAssets.length],
        [t.confirmedSales, confirmedSales],
      ].map(([k, v]) => <div key={String(k)} style={{ ...box, padding: 18 }}>
        <div style={{ fontSize: 12, color: "#69707d", marginBottom: 8 }}>{k}</div>
        <div style={{ fontSize: 28, fontWeight: 800 }}>{v}</div>
      </div>)}
    </section>
    <section style={{ ...box, padding: 20 }}>
      <Heading title={t.referrals} help={t.reviewHelp} action={<button style={secondary} onClick={() => setTab("referrals")}>{t.review} →</button>} />
      <div style={{ display: "grid", gap: 10 }}>
        {referrals.slice(0, 5).map(r => <div key={r.id} style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr .7fr", gap: 12, padding: "10px 0", borderTop: "1px solid #eef0f2", fontSize: 13 }}>
          <span>{r.referred_email || "—"}</span><span style={{ fontFamily: "monospace" }}>{r.referral_code}</span><b>{r.status}</b>
        </div>)}
        {!referrals.length ? <div style={{ color: "#69707d" }}>{t.noData}</div> : null}
      </div>
    </section>
  </div>;

  const agreementPending = agreements.filter(a => a.status === "submitted").length;

  const agreementsView = <section style={{...box,overflow:"hidden"}}>
    <div style={{padding:20}}>
      <Heading
        title={t.agreements}
        help={lang==="zh"?"用户完成注册后必须签署协议。管理员审核通过后，推荐者账号才会正式开放。":lang==="en"?"Users must sign the agreement after registration. Referral access is enabled only after administrator approval.":"Nach der Registrierung muss die Vereinbarung unterzeichnet werden. Das Referral-Konto wird erst nach Admin-Freigabe aktiviert."}
        action={<button style={secondary} onClick={()=>void load()}>{t.refresh}</button>}
      />
      <div style={{fontSize:12,color:"#69707d"}}>{lang==="zh"?"待审核":lang==="en"?"Pending review":"Zu prüfen"}: <b style={{color:"#b26a00"}}>{agreementPending}</b></div>
    </div>
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr style={{textAlign:"left",background:"#f7f8fa",color:"#69707d"}}>
          <th style={{padding:12}}>{t.email}</th>
          <th style={{padding:12}}>{lang==="zh"?"签署人":lang==="en"?"Signer":"Unterzeichner"}</th>
          <th style={{padding:12}}>{lang==="zh"?"协议版本":lang==="en"?"Version":"Version"}</th>
          <th style={{padding:12}}>{t.status}</th>
          <th style={{padding:12}}>{lang==="zh"?"签署时间":lang==="en"?"Signed":"Unterzeichnet"}</th>
          <th style={{padding:12}}>{t.action}</th>
        </tr></thead>
        <tbody>
          {agreements.map(a=><tr key={a.id} style={{borderTop:"1px solid #eef0f2"}}>
            <td style={{padding:12}}><b>{a.email || a.signer_email}</b><div style={{fontSize:11,color:"#69707d"}}>{a.name || ""}</div></td>
            <td style={{padding:12}}>{a.signer_name}</td>
            <td style={{padding:12,fontFamily:"monospace"}}>{a.template_version}</td>
            <td style={{padding:12}}><b style={{color:a.status==="approved"?"#008254":a.status==="rejected"?"#b42318":a.status==="submitted"?"#b26a00":"#333"}}>{a.status}</b></td>
            <td style={{padding:12}}>{new Date(a.signed_at).toLocaleString()}</td>
            <td style={{padding:12}}><button style={secondary} onClick={()=>void openAgreement(a.id)}>{lang==="zh"?"查看/审核":lang==="en"?"View / review":"Ansehen / prüfen"}</button></td>
          </tr>)}
          {!agreements.length?<tr><td colSpan={6} style={{padding:24,color:"#69707d"}}>{t.noData}</td></tr>:null}
        </tbody>
      </table>
    </div>
  </section>;

  const referralsView = <section style={{ ...box, overflow: "hidden" }}>
    <div style={{ padding: 20 }}><Heading title={t.referrals} help={t.reviewHelp} action={<button style={secondary} onClick={() => void load()}>{t.refresh}</button>} /></div>
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr style={{ textAlign: "left", background: "#f7f8fa", color: "#69707d" }}>
          {[t.email,t.code,t.status,t.product,t.order,t.created,t.action].map(x => <th key={x} style={{ padding: 12 }}>{x}</th>)}
        </tr></thead>
        <tbody>
          {referrals.map(r => {
            const review = ["registered","pending"].includes(r.status);
            const draft = reviewDrafts[r.id] || {};
            return <tr key={r.id} style={{ borderTop: "1px solid #eef0f2" }}>
              <td style={{ padding: 12 }}>{r.referred_email || "—"}</td>
              <td style={{ padding: 12, fontFamily: "monospace" }}>{r.referral_code}</td>
              <td style={{ padding: 12 }}><b>{r.status}</b></td>
              <td style={{ padding: 12 }}>
                {review ? <select style={{ ...input, minWidth: 190 }} value={draft.productId || ""} onChange={e => setReviewDrafts(x => ({ ...x, [r.id]: { ...x[r.id], productId: e.target.value || undefined } }))}>
                  <option value="">—</option>{activeProducts.map(p => <option key={p.id} value={p.id}>{modelLabel(p)} · {money(p.referrer_reward,p.currency)}</option>)}
                </select> : modelLabel(program.products.find(p => p.id === r.product_id))}
              </td>
              <td style={{ padding: 12 }}>
                {review ? <input style={{ ...input, minWidth: 140 }} value={draft.orderNumber || ""} onChange={e => setReviewDrafts(x => ({ ...x, [r.id]: { ...x[r.id], orderNumber: e.target.value } }))} /> : r.order_number || "—"}
              </td>
              <td style={{ padding: 12 }}>{new Date(r.created_at).toLocaleDateString()}</td>
              <td style={{ padding: 12 }}>{review ? <div style={{ display: "flex", gap: 7 }}>
                <button style={primary} disabled={!!busy} onClick={() => void updateReferral(r.id,"qualified")}>{t.qualify}</button>
                <button style={secondary} disabled={!!busy} onClick={() => void updateReferral(r.id,"rejected")}>{t.reject}</button>
              </div> : "—"}</td>
            </tr>;
          })}
          {!referrals.length ? <tr><td colSpan={7} style={{ padding: 24, color: "#69707d" }}>{t.noData}</td></tr> : null}
        </tbody>
      </table>
    </div>
  </section>;

  const usersView = <section style={{ ...box, overflow: "hidden" }}>
    <div style={{ padding: 20 }}><Heading title={t.users} action={<button style={secondary} onClick={() => void load()}>{t.refresh}</button>} /></div>
    <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead><tr style={{ textAlign: "left", background: "#f7f8fa", color: "#69707d" }}>
        <th style={{ padding: 12 }}>{t.email}</th><th style={{ padding: 12 }}>{t.status}</th><th style={{ padding: 12 }}>Country</th><th style={{ padding: 12 }}>Language</th><th style={{ padding: 12 }}>{t.created}</th>
      </tr></thead>
      <tbody>{users.map(u => <tr key={u.id} style={{ borderTop: "1px solid #eef0f2" }}>
        <td style={{ padding: 12 }}><b>{[u.first_name,u.last_name].filter(Boolean).join(" ")}</b><div>{u.email}</div></td>
        <td style={{ padding: 12 }}>{u.status}</td><td style={{ padding: 12 }}>{u.country || "—"}</td><td style={{ padding: 12 }}>{u.language || "—"}</td><td style={{ padding: 12 }}>{new Date(u.created_at).toLocaleDateString()}</td>
      </tr>)}</tbody>
    </table></div>
  </section>;

  const productsView = <div style={{ display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 18, alignItems: "start" }}>
    <section style={{ ...box, overflow: "hidden" }}>
      <div style={{ padding: 20 }}><Heading title={t.products} help={t.productHelp} action={<button style={secondary} onClick={() => setProductDraft(emptyProduct())}>{t.newItem}</button>} /></div>
      <div style={{ overflowX: "auto" }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead><tr style={{ textAlign: "left", background: "#f7f8fa", color: "#69707d" }}>
          <th style={{ padding: 12 }}>{t.model}</th><th style={{ padding: 12 }}>{t.price}</th><th style={{ padding: 12 }}>{t.refReward}</th><th style={{ padding: 12 }}>{t.friendDiscount}</th><th style={{ padding: 12 }}>{t.active}</th><th style={{ padding: 12 }}></th>
        </tr></thead>
        <tbody>{program.products.map(p => <tr key={p.id} style={{ borderTop: "1px solid #eef0f2" }}>
          <td style={{ padding: 12 }}><b>{p.model_name}</b><div style={{ color:"#69707d" }}>{p.variant || p.sku || ""}</div></td>
          <td style={{ padding: 12 }}>{p.retail_price == null ? "—" : money(p.retail_price,p.currency)}</td>
          <td style={{ padding: 12, fontWeight: 800, color:"#008254" }}>{money(p.referrer_reward,p.currency)}</td>
          <td style={{ padding: 12 }}>{money(p.friend_discount,p.currency)}</td>
          <td style={{ padding: 12 }}>{p.active ? "✓" : "—"}</td>
          <td style={{ padding: 12 }}><button style={secondary} onClick={() => setProductDraft({ ...p })}>{t.edit}</button></td>
        </tr>)}</tbody>
      </table></div>
    </section>
    <section style={{ ...box, padding: 18 }}>
      <h3 style={{ marginTop: 0 }}>{productDraft.id ? t.edit : t.newItem}</h3>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Field name={t.model}><input style={input} value={productDraft.model_name} onChange={e=>setProductDraft(x=>({...x,model_name:e.target.value}))}/></Field>
        <Field name={t.variant}><input style={input} value={productDraft.variant || ""} onChange={e=>setProductDraft(x=>({...x,variant:e.target.value}))}/></Field>
        <Field name={t.sku}><input style={input} value={productDraft.sku || ""} onChange={e=>setProductDraft(x=>({...x,sku:e.target.value}))}/></Field>
        <Field name={t.price}><input style={input} type="number" value={productDraft.retail_price ?? ""} onChange={e=>setProductDraft(x=>({...x,retail_price:e.target.value===""?null:Number(e.target.value)}))}/></Field>
        <Field name={t.refReward}><input style={input} type="number" value={productDraft.referrer_reward} onChange={e=>setProductDraft(x=>({...x,referrer_reward:Number(e.target.value)}))}/></Field>
        <Field name={t.friendDiscount}><input style={input} type="number" value={productDraft.friend_discount} onChange={e=>setProductDraft(x=>({...x,friend_discount:Number(e.target.value)}))}/></Field>
        <Field name={t.sort}><input style={input} type="number" value={productDraft.sort_order} onChange={e=>setProductDraft(x=>({...x,sort_order:Number(e.target.value)}))}/></Field>
        <Field name={t.active}><label style={{ display:"flex",gap:8,alignItems:"center",height:38 }}><input type="checkbox" checked={productDraft.active} onChange={e=>setProductDraft(x=>({...x,active:e.target.checked}))}/> {t.active}</label></Field>
      </div>
      <div style={{ display:"grid",gap:12,marginTop:12 }}>
        <Field name={t.url}><input style={input} value={productDraft.product_url || ""} onChange={e=>setProductDraft(x=>({...x,product_url:e.target.value}))}/></Field>
        <Field name={t.image}><input style={input} value={productDraft.image_url || ""} onChange={e=>setProductDraft(x=>({...x,image_url:e.target.value}))}/></Field>
        <Field name={t.germanCopy}><textarea style={{...input,minHeight:70}} value={productDraft.copy_de || ""} onChange={e=>setProductDraft(x=>({...x,copy_de:e.target.value}))}/></Field>
        <Field name={t.englishCopy}><textarea style={{...input,minHeight:70}} value={productDraft.copy_en || ""} onChange={e=>setProductDraft(x=>({...x,copy_en:e.target.value}))}/></Field>
        <Field name={t.chineseCopy}><textarea style={{...input,minHeight:70}} value={productDraft.copy_zh || ""} onChange={e=>setProductDraft(x=>({...x,copy_zh:e.target.value}))}/></Field>
      </div>
      <button style={{...primary,width:"100%",marginTop:14}} disabled={!!busy || !productDraft.model_name.trim()} onClick={()=>void saveProgram("admin_save_product",{product:productDraft}).then(()=>setProductDraft(emptyProduct()))}>{t.save}</button>
    </section>
  </div>;

  const assetsView = <div style={{ display:"grid",gridTemplateColumns:"1.2fr .8fr",gap:18,alignItems:"start" }}>
    <section style={{...box,overflow:"hidden"}}>
      <div style={{padding:20}}><Heading title={t.assets} help={t.assetHelp} action={<button style={secondary} onClick={()=>setAssetDraft(emptyAsset())}>{t.newItem}</button>}/></div>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr style={{textAlign:"left",background:"#f7f8fa",color:"#69707d"}}><th style={{padding:12}}>{t.title}</th><th style={{padding:12}}>{t.assetType}</th><th style={{padding:12}}>{t.product}</th><th style={{padding:12}}>{t.active}</th><th style={{padding:12}}></th></tr></thead>
        <tbody>{program.assets.map(a=><tr key={a.id} style={{borderTop:"1px solid #eef0f2"}}>
          <td style={{padding:12}}>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              {a.asset_url && ["image","banner"].includes(a.asset_type) ? <img src={a.asset_url} alt="" style={{width:64,height:44,objectFit:"cover",borderRadius:7,border:"1px solid #e5e7eb",background:"#f7f8fa"}}/> : null}
              <b>{lang==="zh"?(a.title_zh||a.title_de):lang==="en"?(a.title_en||a.title_de):a.title_de}</b>
            </div>
          </td>
          <td style={{padding:12}}>{a.asset_type}</td>
          <td style={{padding:12}}>{modelLabel(program.products.find(p=>p.id===a.product_id))}</td>
          <td style={{padding:12}}>{a.active?"✓":"—"}</td>
          <td style={{padding:12}}><button style={secondary} onClick={()=>setAssetDraft({...a})}>{t.edit}</button></td>
        </tr>)}</tbody>
      </table></div>
    </section>
    <section style={{...box,padding:18}}>
      <h3 style={{marginTop:0}}>{assetDraft.id?t.edit:t.newItem}</h3>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        <Field name={t.assetType}><select style={input} value={assetDraft.asset_type} onChange={e=>setAssetDraft(x=>({...x,asset_type:e.target.value as Asset["asset_type"]}))}>{["copy","image","video","banner","link"].map(x=><option key={x}>{x}</option>)}</select></Field>
        <Field name={t.linkedProduct}><select style={input} value={assetDraft.product_id || ""} onChange={e=>setAssetDraft(x=>({...x,product_id:e.target.value||null}))}><option value="">—</option>{program.products.map(p=><option key={p.id} value={p.id}>{modelLabel(p)}</option>)}</select></Field>
        <Field name={t.sort}><input style={input} type="number" value={assetDraft.sort_order} onChange={e=>setAssetDraft(x=>({...x,sort_order:Number(e.target.value)}))}/></Field>
        <Field name={t.active}><label style={{display:"flex",gap:8,alignItems:"center",height:38}}><input type="checkbox" checked={assetDraft.active} onChange={e=>setAssetDraft(x=>({...x,active:e.target.checked}))}/>{t.active}</label></Field>
      </div>
      <div style={{display:"grid",gap:12,marginTop:12}}>
        <Field name="Titel DE"><input style={input} value={assetDraft.title_de} onChange={e=>setAssetDraft(x=>({...x,title_de:e.target.value}))}/></Field>
        <Field name="Title EN"><input style={input} value={assetDraft.title_en || ""} onChange={e=>setAssetDraft(x=>({...x,title_en:e.target.value}))}/></Field>
        <Field name="标题 中文"><input style={input} value={assetDraft.title_zh || ""} onChange={e=>setAssetDraft(x=>({...x,title_zh:e.target.value}))}/></Field>
        <Field name={lang==="zh"?"宣传图片":lang==="en"?"Promotional image":"Werbebild"}>
          <div style={{display:"grid",gap:9}}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy==="asset-image-upload"}
              onChange={e=>{
                const file=e.target.files?.[0];
                if(file) void uploadAssetImage(file);
                e.currentTarget.value="";
              }}
              style={{...input,padding:8}}
            />
            <div style={{fontSize:11,color:"#69707d"}}>
              {lang==="zh"?"支持 JPG / PNG / WebP，单张最大 8 MB。上传后自动保存图片地址。":lang==="en"?"JPG / PNG / WebP, up to 8 MB. The image URL is filled automatically after upload.":"JPG / PNG / WebP, maximal 8 MB. Die Bild-URL wird nach dem Upload automatisch übernommen."}
            </div>
            {busy==="asset-image-upload" ? <div style={{fontSize:12,color:"#008254",fontWeight:700}}>{lang==="zh"?"正在上传图片…":lang==="en"?"Uploading image…":"Bild wird hochgeladen…"}</div> : null}
            {assetDraft.asset_url && ["image","banner"].includes(assetDraft.asset_type) ? <div style={{border:"1px solid #e3e6ea",borderRadius:12,padding:8,background:"#f8f9fa"}}>
              <img src={assetDraft.asset_url} alt="" style={{width:"100%",maxHeight:240,objectFit:"contain",borderRadius:8,background:"#fff"}}/>
            </div> : null}
          </div>
        </Field>
        <Field name={lang==="zh"?"图片/素材 URL（可手工修改）":lang==="en"?"Image / asset URL (editable)":"Bild-/Material-URL (editierbar)"}><input style={input} value={assetDraft.asset_url || ""} onChange={e=>setAssetDraft(x=>({...x,asset_url:e.target.value}))}/></Field>
        <Field name={t.germanCopy}><textarea style={{...input,minHeight:74}} value={assetDraft.copy_de || ""} onChange={e=>setAssetDraft(x=>({...x,copy_de:e.target.value}))}/></Field>
        <Field name={t.englishCopy}><textarea style={{...input,minHeight:74}} value={assetDraft.copy_en || ""} onChange={e=>setAssetDraft(x=>({...x,copy_en:e.target.value}))}/></Field>
        <Field name={t.chineseCopy}><textarea style={{...input,minHeight:74}} value={assetDraft.copy_zh || ""} onChange={e=>setAssetDraft(x=>({...x,copy_zh:e.target.value}))}/></Field>
      </div>
      <button style={{...primary,width:"100%",marginTop:14}} disabled={!!busy || !assetDraft.title_de.trim()} onClick={()=>void saveProgram("admin_save_asset",{asset:assetDraft}).then(()=>setAssetDraft(emptyAsset()))}>{t.save}</button>
    </section>
  </div>;

  const salesView = <div style={{display:"grid",gridTemplateColumns:"1.2fr .8fr",gap:18,alignItems:"start"}}>
    <section style={{...box,overflow:"hidden"}}>
      <div style={{padding:20}}><Heading title={t.sales} help={t.salesHelp} action={<button style={secondary} onClick={()=>setSaleDraft(emptySale())}>{t.newItem}</button>}/></div>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr style={{textAlign:"left",background:"#f7f8fa",color:"#69707d"}}><th style={{padding:12}}>{t.order}</th><th style={{padding:12}}>{t.product}</th><th style={{padding:12}}>{t.quantity}</th><th style={{padding:12}}>{t.net}</th><th style={{padding:12}}>{t.reward}</th><th style={{padding:12}}>{t.status}</th><th style={{padding:12}}></th></tr></thead>
        <tbody>{program.sales.map(s=><tr key={s.id} style={{borderTop:"1px solid #eef0f2"}}>
          <td style={{padding:12}}><b>{s.order_number || "—"}</b><div style={{color:"#69707d"}}>{s.referrals?.referral_code || ""}</div></td>
          <td style={{padding:12}}>{[s.referral_products?.model_name,s.referral_products?.variant].filter(Boolean).join(" · ") || "—"}</td>
          <td style={{padding:12}}>{s.quantity}</td><td style={{padding:12}}>{money(s.net_sales,s.currency)}</td><td style={{padding:12,color:"#008254",fontWeight:800}}>{money(s.reward_amount,s.currency)}</td><td style={{padding:12}}>{s.status}</td>
          <td style={{padding:12}}><button style={secondary} onClick={()=>setSaleDraft({...s,sold_at:s.sold_at?.slice(0,10)})}>{t.edit}</button></td>
        </tr>)}</tbody>
      </table></div>
    </section>
    <section style={{...box,padding:18}}>
      <h3 style={{marginTop:0}}>{saleDraft.id?t.edit:t.newItem}</h3>
      <div style={{display:"grid",gap:12}}>
        <Field name={t.order}><input style={input} value={saleDraft.order_number || ""} onChange={e=>setSaleDraft(x=>({...x,order_number:e.target.value}))}/></Field>
        <Field name={t.product}><select style={input} value={saleDraft.product_id || ""} onChange={e=>setSaleDraft(x=>({...x,product_id:e.target.value||null}))}><option value="">—</option>{program.products.map(p=><option key={p.id} value={p.id}>{modelLabel(p)} · {money(p.referrer_reward,p.currency)}</option>)}</select></Field>
        <Field name={t.referrals}><select style={input} value={saleDraft.referral_id || ""} onChange={e=>setSaleDraft(x=>({...x,referral_id:e.target.value||null}))}><option value="">—</option>{referrals.map(r=><option key={r.id} value={r.id}>{r.referral_code} · {r.referred_email || "—"}</option>)}</select></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field name={t.quantity}><input style={input} type="number" value={saleDraft.quantity} onChange={e=>setSaleDraft(x=>({...x,quantity:Number(e.target.value)}))}/></Field>
          <Field name={t.soldAt}><input style={input} type="date" value={saleDraft.sold_at?.slice(0,10) || ""} onChange={e=>setSaleDraft(x=>({...x,sold_at:e.target.value}))}/></Field>
          <Field name={t.gross}><input style={input} type="number" value={saleDraft.gross_sales} onChange={e=>setSaleDraft(x=>({...x,gross_sales:Number(e.target.value)}))}/></Field>
          <Field name={t.net}><input style={input} type="number" value={saleDraft.net_sales} onChange={e=>setSaleDraft(x=>({...x,net_sales:Number(e.target.value)}))}/></Field>
          <Field name={t.status}><select style={input} value={saleDraft.status} onChange={e=>setSaleDraft(x=>({...x,status:e.target.value as Sale["status"]}))}>{["pending","confirmed","cancelled","returned"].map(x=><option key={x}>{x}</option>)}</select></Field>
          <Field name={t.reward}><input style={input} type="number" value={saleDraft.reward_amount} onChange={e=>setSaleDraft(x=>({...x,reward_amount:Number(e.target.value)}))} placeholder="0 = product default"/></Field>
        </div>
        <Field name={t.notes}><textarea style={{...input,minHeight:70}} value={saleDraft.notes || ""} onChange={e=>setSaleDraft(x=>({...x,notes:e.target.value}))}/></Field>
      </div>
      <button style={{...primary,width:"100%",marginTop:14}} disabled={!!busy} onClick={()=>void saveProgram("admin_save_sale",{sale:saleDraft}).then(()=>setSaleDraft(emptySale()))}>{t.save}</button>
    </section>
  </div>;

  const payoutsView = <section style={{...box,overflow:"hidden"}}>
    <div style={{padding:20}}>
      <Heading
        title={lang==="zh"?"提现审核":lang==="en"?"Payout review":"Auszahlungen"}
        help={lang==="zh"?"审核推荐者提现申请。银行信息默认掩码显示，点击银行信息后才查看完整收款信息。":lang==="en"?"Review payout requests. Bank data is masked by default and revealed only when needed for payment.":"Auszahlungsanträge prüfen. Bankdaten werden standardmäßig maskiert und nur bei Bedarf vollständig angezeigt."}
        action={<button style={secondary} onClick={()=>void load()}>{t.refresh}</button>}
      />
    </div>
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr style={{textAlign:"left",background:"#f7f8fa",color:"#69707d"}}>
          <th style={{padding:12}}>E-Mail</th>
          <th style={{padding:12}}>{lang==="zh"?"金额":lang==="en"?"Amount":"Betrag"}</th>
          <th style={{padding:12}}>{lang==="zh"?"银行账户":lang==="en"?"Bank account":"Bankkonto"}</th>
          <th style={{padding:12}}>{t.status}</th>
          <th style={{padding:12}}>{lang==="zh"?"申请时间":lang==="en"?"Requested":"Angefordert"}</th>
          <th style={{padding:12}}>{t.action}</th>
        </tr></thead>
        <tbody>
          {payouts.map(po=><tr key={po.id} style={{borderTop:"1px solid #eef0f2",verticalAlign:"top"}}>
            <td style={{padding:12}}><b>{po.email || "—"}</b><div style={{fontSize:11,color:"#69707d",marginTop:3}}>{po.name || ""}</div></td>
            <td style={{padding:12,fontWeight:800}}>{money(po.amount,po.currency)}</td>
            <td style={{padding:12}}><div>{po.account_holder || "—"}</div><button style={{...secondary,marginTop:6,padding:"6px 9px"}} onClick={()=>void showBankDetails(po.id)}>{po.iban_masked || (lang==="zh"?"查看银行信息":lang==="en"?"View bank details":"Bankdaten anzeigen")}</button></td>
            <td style={{padding:12}}><b>{po.status}</b>{po.admin_note?<div style={{fontSize:11,color:"#69707d",marginTop:4}}>{po.admin_note}</div>:null}</td>
            <td style={{padding:12}}>{new Date(po.requested_at).toLocaleString()}</td>
            <td style={{padding:12}}>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {po.status==="requested"?<>
                  <button style={primary} disabled={!!busy} onClick={()=>void updatePayout(po.id,"approved")}>{lang==="zh"?"通过":lang==="en"?"Approve":"Freigeben"}</button>
                  <button style={danger} disabled={!!busy} onClick={()=>void updatePayout(po.id,"rejected")}>{t.reject}</button>
                </>:null}
                {po.status==="approved"?<>
                  <button style={primary} disabled={!!busy} onClick={()=>void updatePayout(po.id,"paid")}>{lang==="zh"?"已支付":lang==="en"?"Mark paid":"Als bezahlt markieren"}</button>
                  <button style={danger} disabled={!!busy} onClick={()=>void updatePayout(po.id,"rejected")}>{t.reject}</button>
                </>:null}
              </div>
            </td>
          </tr>)}
          {!payouts.length?<tr><td colSpan={6} style={{padding:24,color:"#69707d"}}>{t.noData}</td></tr>:null}
        </tbody>
      </table>
    </div>
  </section>;

  const adminsView = adminRole === "super_admin" ? <div style={{display:"grid",gridTemplateColumns:"1.2fr .8fr",gap:18,alignItems:"start"}}>
    <section style={{...box,overflow:"hidden"}}>
      <div style={{padding:20}}><Heading title={lang==="zh"?"管理员管理":lang==="en"?"Administrator management":"Administratoren verwalten"} help={lang==="zh"?"超级管理员可以新增后台管理员账号。":lang==="en"?"Super admins can create additional administrator accounts.":"Super-Administratoren können weitere Admin-Konten anlegen."}/></div>
      <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead><tr style={{textAlign:"left",background:"#f7f8fa",color:"#69707d"}}><th style={{padding:12}}>E-Mail</th><th style={{padding:12}}>Role</th><th style={{padding:12}}>{t.created}</th><th style={{padding:12}}>Last Login</th></tr></thead>
        <tbody>{admins.map(a=><tr key={a.id} style={{borderTop:"1px solid #eef0f2"}}><td style={{padding:12,fontWeight:700}}>{a.email}</td><td style={{padding:12}}>{a.role}</td><td style={{padding:12}}>{new Date(a.created_at).toLocaleDateString()}</td><td style={{padding:12}}>{a.last_sign_in_at?new Date(a.last_sign_in_at).toLocaleString():"—"}</td></tr>)}
        {!admins.length?<tr><td colSpan={4} style={{padding:24,color:"#69707d"}}>{t.noData}</td></tr>:null}</tbody>
      </table></div>
    </section>
    <section style={{...box,padding:18}}>
      <h3 style={{marginTop:0}}>{lang==="zh"?"新增管理员":lang==="en"?"Add administrator":"Administrator hinzufügen"}</h3>
      <p style={{fontSize:12,color:"#69707d",lineHeight:1.5}}>{lang==="zh"?"设置初始密码后，新管理员可直接使用邮箱+密码登录。":lang==="en"?"Set an initial password so the new admin can sign in immediately with email and password.":"Legen Sie ein Startpasswort fest. Danach kann sich der neue Admin direkt mit E-Mail und Passwort anmelden."}</p>
      <div style={{display:"grid",gap:12}}>
        <Field name="E-Mail"><input style={input} type="email" value={adminDraft.email} onChange={e=>setAdminDraft(x=>({...x,email:e.target.value}))}/></Field>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
          <Field name={lang==="zh"?"名":lang==="en"?"First name":"Vorname"}><input style={input} value={adminDraft.firstName} onChange={e=>setAdminDraft(x=>({...x,firstName:e.target.value}))}/></Field>
          <Field name={lang==="zh"?"姓":lang==="en"?"Last name":"Nachname"}><input style={input} value={adminDraft.lastName} onChange={e=>setAdminDraft(x=>({...x,lastName:e.target.value}))}/></Field>
        </div>
        <Field name={lang==="zh"?"初始密码（至少12位）":lang==="en"?"Initial password (12+ characters)":"Startpasswort (mind. 12 Zeichen)"}><input style={input} type="password" value={adminDraft.password} onChange={e=>setAdminDraft(x=>({...x,password:e.target.value}))}/></Field>
        <Field name={lang==="zh"?"再次输入密码":lang==="en"?"Repeat password":"Passwort wiederholen"}><input style={input} type="password" value={adminDraft.passwordConfirm} onChange={e=>setAdminDraft(x=>({...x,passwordConfirm:e.target.value}))}/></Field>
      </div>
      <button style={{...primary,width:"100%",marginTop:14}} disabled={!!busy||!adminDraft.email||adminDraft.password.length<12||adminDraft.password!==adminDraft.passwordConfirm} onClick={()=>void createAdmin()}>{lang==="zh"?"创建管理员":lang==="en"?"Create administrator":"Administrator anlegen"}</button>
    </section>
  </div> : <div/>;

  const settingsView = <div style={{display:"grid",gap:18,maxWidth:900}}>
    <section style={{...box,padding:20}}>
      <Heading title={t.maintenance}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field name={t.programName}><input style={input} value={settingsDraft.name || ""} onChange={e=>setSettingsDraft(x=>({...x,name:e.target.value}))}/></Field>
        <Field name={t.market}><input style={input} value={settingsDraft.market || "AT"} onChange={e=>setSettingsDraft(x=>({...x,market:e.target.value}))}/></Field>
        <Field name={t.currency}><input style={input} value={settingsDraft.currency || "EUR"} onChange={e=>setSettingsDraft(x=>({...x,currency:e.target.value}))}/></Field>
        <Field name={t.supportEmail}><input style={input} value={settingsDraft.support_email || ""} onChange={e=>setSettingsDraft(x=>({...x,support_email:e.target.value}))}/></Field>
        <Field name={t.defaultLanguage}><select style={input} value={settingsDraft.default_language || "de"} onChange={e=>setSettingsDraft(x=>({...x,default_language:e.target.value}))}><option value="de">Deutsch</option><option value="en">English</option><option value="zh">中文</option></select></Field>
        <Field name={t.termsVersion}><input style={input} value={settingsDraft.terms_version || "v1"} onChange={e=>setSettingsDraft(x=>({...x,terms_version:e.target.value}))}/></Field>
      </div>
      <button style={{...primary,marginTop:16}} disabled={!!busy} onClick={()=>void saveProgram("admin_save_settings",{key:"program",value:settingsDraft})}>{t.save}</button>
    </section>
    <section style={{...box,padding:20}}>
      <Heading title={lang==="zh"?"管理员登录密码":lang==="en"?"Administrator password":"Administrator-Passwort"} help={lang==="zh"?"管理员正式登录方式为邮箱 + 密码。当前账号可以在这里首次设置或修改密码。":lang==="en"?"Administrator sign-in uses email and password. Set or change the current account password here.":"Administratoren melden sich mit E-Mail und Passwort an. Hier können Sie das Passwort dieses Kontos festlegen oder ändern."}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <Field name={lang==="zh"?"新密码（至少12位）":lang==="en"?"New password (12+ characters)":"Neues Passwort (mind. 12 Zeichen)"}><input style={input} type="password" value={passwordDraft.password} onChange={e=>setPasswordDraft(x=>({...x,password:e.target.value}))}/></Field>
        <Field name={lang==="zh"?"再次输入新密码":lang==="en"?"Repeat new password":"Neues Passwort wiederholen"}><input style={input} type="password" value={passwordDraft.passwordConfirm} onChange={e=>setPasswordDraft(x=>({...x,passwordConfirm:e.target.value}))}/></Field>
      </div>
      <button style={{...primary,marginTop:16}} disabled={!!busy||passwordDraft.password.length<12||passwordDraft.password!==passwordDraft.passwordConfirm} onClick={()=>void updateOwnPassword()}>{lang==="zh"?"设置/修改密码":lang==="en"?"Set / change password":"Passwort festlegen / ändern"}</button>
    </section>
  </div>;

  const views: Record<Tab, React.ReactNode> = {
    dashboard, agreements: agreementsView, referrals: referralsView, users: usersView, products: productsView, assets: assetsView, sales: salesView, payouts: payoutsView, admins: adminsView, settings: settingsView,
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f4f6f8", color:"#121316", fontFamily:"Arial, sans-serif" }}>
      <header style={{ background:"#fff", borderBottom:"1px solid #e3e6ea", padding:"16px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", position:"sticky", top:0, zIndex:20 }}>
        <div><div style={{fontSize:12,color:"#008254",fontWeight:800}}>OPPO AUSTRIA</div><div style={{fontSize:24,fontWeight:800,marginTop:3}}>Referral Admin</div></div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <select value={lang} onChange={e=>setLang(e.target.value as Lang)} style={{...input,width:110}}><option value="de">DE</option><option value="en">EN</option><option value="zh">中文</option></select>
          <div style={{fontSize:12,textAlign:"right"}}><b>{adminEmail}</b><div style={{color:"#69707d"}}>{adminRole === "super_admin" ? "Super Administrator" : "Administrator"}</div></div>
          <button style={secondary} onClick={()=>void signOut()}>{t.logout}</button>
        </div>
      </header>
      <div style={{display:"grid",gridTemplateColumns:"220px 1fr",minHeight:"calc(100vh - 73px)"}}>
        <aside style={{background:"#fff",borderRight:"1px solid #e3e6ea",padding:14}}>
          <nav style={{display:"grid",gap:5}}>{nav.map(([k,name])=><button key={k} onClick={()=>setTab(k)} style={{border:0,borderRadius:9,padding:"11px 12px",textAlign:"left",cursor:"pointer",fontWeight:700,background:tab===k?"#e9f6f0":"transparent",color:tab===k?"#008254":"#30343a"}}>{name}</button>)}</nav>
        </aside>
        <main style={{padding:24,minWidth:0}}>
          {error ? <div style={{marginBottom:16,padding:12,borderRadius:10,background:"#fff1f2",color:"#b42318"}}>{error}</div> : null}
          {views[tab]}
        </main>
      </div>
    </div>
  );
}
