"use client";

import { useEffect, useMemo, useState } from "react";

type Lang = "de" | "en" | "zh";

type Profile = {
  email: string;
  first_name?: string | null;
  last_name?: string | null;
};

type Dashboard = {
  referralCode: string;
  referralLink: string;
  successfulReferrals: number;
  pendingReferrals: number;
  currentTier: string;
  availableReward: number;
  totalRewardAmount: number;
};

type Referral = {
  id: string;
  status: string;
  createdAt: string;
  registeredAt?: string | null;
  qualifiedAt?: string | null;
  referredEmail?: string | null;
  productName?: string | null;
  reward?: number;
};

type Product = {
  id: string;
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
};

type Asset = {
  id: string;
  product_id?: string | null;
  asset_type: string;
  title_de: string;
  title_en?: string | null;
  title_zh?: string | null;
  copy_de?: string | null;
  copy_en?: string | null;
  copy_zh?: string | null;
  asset_url?: string | null;
};

type Program = {
  products: Product[];
  assets: Asset[];
  settings: Record<string, unknown>;
};

type Reward = {
  id: string;
  reward_amount: number;
  currency: string;
  status: string;
};

type PayoutAccount = {
  id: string;
  accountHolder: string;
  ibanMasked: string;
  bic?: string | null;
  country: string;
  updatedAt: string;
};

type PayoutRequest = {
  id: string;
  amount: number;
  currency: string;
  payout_method: string;
  status: string;
  requested_at: string;
  approved_at?: string | null;
  paid_at?: string | null;
  rejected_at?: string | null;
  admin_note?: string | null;
};

type PayoutSummary = {
  account: PayoutAccount | null;
  withdrawable: number;
  requests: PayoutRequest[];
};

type AgreementSummary = {
  required: boolean;
  contractComplete?: boolean;
  agreement: {
    id: string;
    status: string;
    signing_method?: "electronic" | "paper";
    paper_status?: string | null;
    reviewed_at?: string | null;
    review_note?: string | null;
  } | null;
};

const words = {
  de: {
    title: "Mein OPPO Empfehlungsprogramm",
    earned: "Meine Empfehlungsprämie",
    available: "Jetzt auszahlbar",
    total: "Gesamt verdient",
    pending: "In Prüfung",
    success: "Erfolgreiche Empfehlungen",
    link: "Mein Empfehlungslink",
    copyLink: "Link kopieren",
    whatsapp: "Per WhatsApp teilen",
    qr: "Mein QR-Code",
    downloadQr: "QR-Code herunterladen",
    products: "Was kann ich empfehlen?",
    productsHelp: "Sie sehen sofort, wie viel Sie je erfolgreichem Kauf erhalten.",
    myReward: "Ihre Prämie",
    friendBenefit: "Vorteil für Freund",
    rrp: "UVP",
    copyProduct: "Produkt-Empfehlung kopieren",
    assets: "Werbematerial zum direkten Teilen",
    assetsHelp: "Bilder und Textvorlagen können direkt zusammen geteilt werden.",
    copyAll: "Text kopieren",
    shareAsset: "Bild + Text teilen",
    downloadImage: "Bild herunterladen",
    openAsset: "Material öffnen",
    contract: "Vertrag",
    contractHelp: "Der Vertrag ist Teil der Registrierungskontrolle, blockiert aber Ihr Dashboard nicht.",
    contractOpen: "Vertragscenter öffnen",
    contractNotStarted: "Noch nicht begonnen",
    contractPaper: "Papiervertrag gewählt",
    contractSubmitted: "Elektronisch unterschrieben",
    contractComplete: "Vertrag vollständig",
    payout: "Bankkonto & Auszahlung",
    payoutHelp: "Bankdaten verwalten und verfügbares Guthaben zur Auszahlung anfordern.",
    holder: "Kontoinhaber",
    iban: "IBAN",
    bic: "BIC",
    saveBank: "Bankdaten speichern",
    savedBank: "Gespeichertes Auszahlungskonto",
    requestPayout: "Gesamtes verfügbares Guthaben auszahlen",
    noBalance: "Aktuell ist kein auszahlbares Guthaben verfügbar.",
    payoutHistory: "Auszahlungsverlauf",
    requestedAt: "Angefordert",
    amount: "Betrag",
    payoutStatus: "Status",
    activity: "Meine Empfehlungen",
    contact: "Kontakt",
    product: "Produkt",
    status: "Status",
    reward: "Prämie",
    date: "Datum",
    noReferrals: "Noch keine Empfehlungen. Teilen Sie Ihren Link oder ein Produkt, um zu starten.",
    noAssets: "Noch keine Werbematerialien verfügbar.",
    noPayouts: "Noch keine Auszahlungsanträge.",
    logout: "Abmelden",
    copied: "Kopiert",
    saved: "Gespeichert",
    requested: "Auszahlung angefordert",
    loading: "Daten werden geladen …",
    error: "Daten konnten nicht geladen werden.",
  },
  en: {
    title: "My OPPO Referral Program",
    earned: "My referral earnings",
    available: "Available to withdraw",
    total: "Total earned",
    pending: "Pending",
    success: "Successful referrals",
    link: "My referral link",
    copyLink: "Copy link",
    whatsapp: "Share on WhatsApp",
    qr: "My QR code",
    downloadQr: "Download QR code",
    products: "What can I recommend?",
    productsHelp: "See exactly how much you earn for each successful purchase.",
    myReward: "Your reward",
    friendBenefit: "Friend benefit",
    rrp: "RRP",
    copyProduct: "Copy product referral",
    assets: "Ready-to-share marketing assets",
    assetsHelp: "Share promotional images and prepared copy together with your personal referral link.",
    copyAll: "Copy text",
    shareAsset: "Share image + text",
    downloadImage: "Download image",
    openAsset: "Open asset",
    contract: "Contract",
    contractHelp: "The contract is part of registration review, but it does not block your dashboard.",
    contractOpen: "Open contract center",
    contractNotStarted: "Not started",
    contractPaper: "Paper contract selected",
    contractSubmitted: "Electronically signed",
    contractComplete: "Contract complete",
    payout: "Bank account & payout",
    payoutHelp: "Manage your bank details and request payout of available rewards.",
    holder: "Account holder",
    iban: "IBAN",
    bic: "BIC",
    saveBank: "Save bank details",
    savedBank: "Saved payout account",
    requestPayout: "Withdraw all available balance",
    noBalance: "There is currently no withdrawable balance.",
    payoutHistory: "Payout history",
    requestedAt: "Requested",
    amount: "Amount",
    payoutStatus: "Status",
    activity: "My referrals",
    contact: "Contact",
    product: "Product",
    status: "Status",
    reward: "Reward",
    date: "Date",
    noReferrals: "No referrals yet. Share your link or a product to get started.",
    noAssets: "No marketing assets available yet.",
    noPayouts: "No payout requests yet.",
    logout: "Sign out",
    copied: "Copied",
    saved: "Saved",
    requested: "Payout requested",
    loading: "Loading your referral data …",
    error: "Could not load your referral data.",
  },
  zh: {
    title: "我的 OPPO 推荐中心",
    earned: "我的推荐收益",
    available: "当前可提现",
    total: "累计获得",
    pending: "待确认",
    success: "成功推荐",
    link: "我的推荐链接",
    copyLink: "复制链接",
    whatsapp: "WhatsApp 分享",
    qr: "我的推荐二维码",
    downloadQr: "下载二维码",
    products: "推荐什么产品能赚多少钱？",
    productsHelp: "每个机型的推荐返利和朋友优惠清晰展示。",
    myReward: "我可获得",
    friendBenefit: "朋友可获得",
    rrp: "零售价",
    copyProduct: "复制该机型推荐内容",
    assets: "一键拿宣传素材去推广",
    assetsHelp: "宣传图片和文案可以一起分享，并自动带上你的个人推荐链接。",
    copyAll: "复制文案",
    shareAsset: "分享图片+文案",
    downloadImage: "下载图片",
    openAsset: "打开素材",
    contract: "合同",
    contractHelp: "合同是注册审核中的一个审核点，但不会阻止你使用推荐者后台。",
    contractOpen: "进入合同中心",
    contractNotStarted: "尚未开始",
    contractPaper: "已选择纸质合同",
    contractSubmitted: "电子签已提交",
    contractComplete: "合同已完成",
    payout: "银行账户与提现",
    payoutHelp: "维护收款银行信息，并申请提现当前可用推荐收益。",
    holder: "账户持有人",
    iban: "IBAN",
    bic: "BIC",
    saveBank: "保存银行信息",
    savedBank: "当前收款账户",
    requestPayout: "申请提现全部可用余额",
    noBalance: "当前没有可提现余额。",
    payoutHistory: "提现记录",
    requestedAt: "申请时间",
    amount: "金额",
    payoutStatus: "状态",
    activity: "我的推荐记录",
    contact: "被推荐人",
    product: "产品",
    status: "状态",
    reward: "收益",
    date: "日期",
    noReferrals: "还没有推荐记录。复制推荐链接或产品素材开始推广。",
    noAssets: "暂时没有可用宣传素材。",
    noPayouts: "暂时没有提现记录。",
    logout: "退出登录",
    copied: "已复制",
    saved: "已保存",
    requested: "提现申请已提交",
    loading: "正在加载推荐数据…",
    error: "推荐数据加载失败。",
  },
} as const;

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

function money(value: number, lang: Lang, currency = "EUR") {
  return new Intl.NumberFormat(lang === "zh" ? "zh-CN" : lang === "en" ? "en-GB" : "de-AT", {
    style: "currency",
    currency,
  }).format(Number(value || 0));
}

function payoutStatus(status: string, lang: Lang) {
  const map: Record<string, [string,string,string]> = {
    requested: ["Angefordert", "Requested", "已申请"],
    approved: ["Freigegeben", "Approved", "已审核"],
    paid: ["Ausgezahlt", "Paid", "已支付"],
    rejected: ["Abgelehnt", "Rejected", "已拒绝"],
    cancelled: ["Storniert", "Cancelled", "已取消"],
  };
  const labels = map[status] || [status,status,status];
  return lang === "zh" ? labels[2] : lang === "en" ? labels[1] : labels[0];
}

export default function MemberClient() {
  const [lang, setLang] = useState<Lang>("de");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [program, setProgram] = useState<Program>({ products: [], assets: [], settings: {} });
  const [payout, setPayout] = useState<PayoutSummary>({ account: null, withdrawable: 0, requests: [] });
  const [agreement, setAgreement] = useState<AgreementSummary>({ required: true, agreement: null, contractComplete: false });
  const [bankDraft, setBankDraft] = useState({ accountHolder: "", iban: "", bic: "", country: "AT" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const t = words[lang];

  async function reloadPayout() {
    const p = await api<PayoutSummary>("/api/payout");
    setPayout(p);
    setBankDraft(x => ({
      ...x,
      accountHolder: p.account?.accountHolder || x.accountHolder,
      bic: p.account?.bic || x.bic,
      country: p.account?.country || x.country || "AT",
      iban: "",
    }));
  }

  useEffect(() => {
    const saved = window.localStorage.getItem("oppo_referral_lang");
    if (saved === "de" || saved === "en" || saved === "zh") setLang(saved);
    void (async () => {
      try {
        const [p, d, refs, rw, pg, po, ag] = await Promise.all([
          api<Profile>("/api/profile"),
          api<Dashboard>("/api/referral/me"),
          api<Referral[]>("/api/referral/list"),
          api<Reward[]>("/api/rewards"),
          api<Program>("/api/program"),
          api<PayoutSummary>("/api/payout"),
          api<AgreementSummary>("/api/agreement"),
        ]);
        setProfile(p);
        setDashboard(d);
        setReferrals(refs);
        setRewards(rw);
        setProgram(pg);
        setPayout(po);
        setAgreement(ag);
        setBankDraft({
          accountHolder: po.account?.accountHolder || [p.first_name,p.last_name].filter(Boolean).join(" "),
          iban: "",
          bic: po.account?.bic || "",
          country: po.account?.country || "AT",
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : t.error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const pendingReward = useMemo(
    () => rewards.filter(r => r.status === "pending").reduce((s, r) => s + Number(r.reward_amount || 0), 0),
    [rewards],
  );

  function local(obj: Product | Asset, base: "copy" | "title") {
    const key = lang === "zh" ? base + "_zh" : lang === "en" ? base + "_en" : base + "_de";
    return String((obj as any)[key] || (obj as any)[base + "_de"] || "");
  }

  async function copy(text: string) {
    await navigator.clipboard.writeText(text);
    setNotice(t.copied);
    window.setTimeout(() => setNotice(""), 1800);
  }

  function productShareText(p: Product) {
    const name = [p.model_name, p.variant].filter(Boolean).join(" · ");
    const base = local(p, "copy");
    const benefit = lang === "zh"
      ? `推荐 ${name}：朋友可获得 ${money(p.friend_discount, lang, p.currency)} 优惠，我成功推荐后可获得 ${money(p.referrer_reward, lang, p.currency)}。`
      : lang === "en"
        ? `I recommend ${name}. Your benefit: ${money(p.friend_discount, lang, p.currency)}. My referral reward after a successful purchase: ${money(p.referrer_reward, lang, p.currency)}.`
        : `Meine Empfehlung: ${name}. Dein Vorteil: ${money(p.friend_discount, lang, p.currency)}. Meine Prämie nach erfolgreichem Kauf: ${money(p.referrer_reward, lang, p.currency)}.`;
    return [base || benefit, dashboard?.referralLink].filter(Boolean).join("\n\n");
  }

  function assetShareText(a: Asset) {
    const body = local(a, "copy") || local(a, "title");
    return [body, dashboard?.referralLink].filter(Boolean).join("\n\n");
  }

  async function shareAsset(a: Asset) {
    const text = assetShareText(a);
    try {
      if (a.asset_url && navigator.share) {
        const response = await fetch(a.asset_url);
        const blob = await response.blob();
        const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
        const file = new File([blob], `oppo-referral-${a.id}.${ext}`, { type: blob.type || "image/jpeg" });
        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          await navigator.share({ title: local(a, "title"), text, files: [file] });
          return;
        }
      }
      if (navigator.share) {
        await navigator.share({ title: local(a, "title"), text, url: a.asset_url || dashboard?.referralLink });
        return;
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
    }
    await copy(text);
    if (a.asset_url) window.open(a.asset_url, "_blank", "noopener");
  }

  async function downloadAsset(a: Asset) {
    if (!a.asset_url) return;
    try {
      const response = await fetch(a.asset_url);
      const blob = await response.blob();
      const ext = blob.type === "image/png" ? "png" : blob.type === "image/webp" ? "webp" : "jpg";
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `oppo-referral-${a.id}.${ext}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(a.asset_url, "_blank", "noopener");
    }
  }

  async function saveBank() {
    setBusy("bank");
    setError("");
    try {
      await api("/api/payout/account", { method: "PUT", body: JSON.stringify(bankDraft) });
      await reloadPayout();
      setNotice(t.saved);
      window.setTimeout(() => setNotice(""), 1800);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save bank account.");
    } finally {
      setBusy("");
    }
  }

  async function requestPayout() {
    if (!payout.account || payout.withdrawable <= 0) return;
    const message = lang === "zh"
      ? `确认申请提现 ${money(payout.withdrawable, lang)} 到 ${payout.account.ibanMasked}？`
      : lang === "en"
        ? `Request payout of ${money(payout.withdrawable, lang)} to ${payout.account.ibanMasked}?`
        : `Auszahlung von ${money(payout.withdrawable, lang)} auf ${payout.account.ibanMasked} anfordern?`;
    if (!window.confirm(message)) return;
    setBusy("payout");
    setError("");
    try {
      await api("/api/payout", { method: "POST" });
      await reloadPayout();
      setNotice(t.requested);
      window.setTimeout(() => setNotice(""), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to request payout.");
    } finally {
      setBusy("");
    }
  }

  async function logout() {
    await api("/api/auth/logout", { method: "POST" }).catch(() => undefined);
    window.location.assign("/portal/index.html");
  }

  function changeLang(value: Lang) {
    setLang(value);
    window.localStorage.setItem("oppo_referral_lang", value);
  }

  if (loading) return <div style={{ padding: 40, fontFamily: "Arial, sans-serif" }}>{t.loading}</div>;
  if (error && (!dashboard || !profile)) return <div style={{ padding: 40, color: "#b42318", fontFamily: "Arial, sans-serif" }}>{error || t.error}</div>;
  if (!dashboard || !profile) return null;

  return (
    <div className="member-shell">
      <style>{`
        *{box-sizing:border-box}
        body{background:#f5f6f7;color:#111}
        .member-shell{min-height:100vh;font-family:Arial,sans-serif}
        .topbar{height:72px;background:#fff;border-bottom:1px solid #e6e8eb;display:flex;align-items:center;justify-content:space-between;padding:0 28px;position:sticky;top:0;z-index:20}
        .brand{font-weight:900;font-size:20px;letter-spacing:-.4px}.brand span{color:#008254}
        .top-actions{display:flex;gap:10px;align-items:center}
        .btn{border:1px solid #d8dde3;background:#fff;border-radius:10px;padding:10px 14px;font-weight:700;cursor:pointer;text-decoration:none;color:#111;font-size:13px}
        .btn:disabled{opacity:.45;cursor:not-allowed}.btn-primary{background:#008254;color:#fff;border-color:#008254}.btn-dark{background:#111;color:#fff;border-color:#111}
        .container{max-width:1240px;margin:0 auto;padding:28px}
        .welcome{display:flex;align-items:end;justify-content:space-between;gap:20px;margin-bottom:20px}
        .welcome h1{font-size:30px;margin:0 0 6px}.muted{color:#6d7480}
        .hero{display:grid;grid-template-columns:1.25fr .75fr;gap:16px;margin-bottom:24px}
        .card{background:#fff;border:1px solid #e3e6ea;border-radius:18px}
        .earnings{padding:26px;background:linear-gradient(135deg,#fff 0%,#f0faf6 100%);border-color:#cfe9de}
        .eyebrow{font-size:12px;color:#008254;font-weight:900;text-transform:uppercase;letter-spacing:.7px}
        .amount{font-size:58px;font-weight:900;letter-spacing:-2px;margin:6px 0}
        .stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:20px}
        .stat{background:#fff;border:1px solid #e7eaed;border-radius:14px;padding:14px}.stat b{display:block;font-size:22px;margin-top:6px}
        .sharebox{padding:22px}.share-top{display:grid;grid-template-columns:1fr 118px;gap:16px;align-items:center}.qr{width:118px;height:118px;border:1px solid #e2e5e8;border-radius:12px;background:#fff}
        .code{font:700 14px monospace;background:#f4f5f6;border-radius:10px;padding:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .row{display:flex;gap:8px;flex-wrap:wrap}
        .section{margin-top:28px}.section-head{display:flex;justify-content:space-between;align-items:end;gap:16px;margin-bottom:14px}.section h2{font-size:24px;margin:0 0 5px}
        .product-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
        .product-card{padding:20px;display:flex;flex-direction:column;min-height:310px}
        .product-title{font-size:18px;font-weight:900;margin:8px 0 14px}
        .reward-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .reward-box{border-radius:12px;padding:12px;background:#f2f8f5}.reward-box.secondary{background:#f5f6f7}
        .reward-box small{display:block;color:#6d7480}.reward-box b{display:block;margin-top:5px;font-size:22px;color:#008254}.reward-box.secondary b{color:#111}
        .product-copy{font-size:13px;line-height:1.5;color:#555;margin:14px 0;flex:1}
        .asset-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
        .asset-card{padding:20px}.asset-type{font-size:11px;font-weight:900;color:#008254;text-transform:uppercase}.asset-title{font-size:17px;font-weight:900;margin:6px 0 10px}.asset-copy{font-size:13px;line-height:1.6;color:#4b5058;white-space:pre-wrap}
        .payout-grid{display:grid;grid-template-columns:.9fr 1.1fr;gap:14px}.panel{padding:20px}.field{display:grid;gap:5px;margin-top:12px}.field label{font-size:12px;font-weight:700;color:#555}.field input{width:100%;padding:11px 12px;border:1px solid #d8dde3;border-radius:10px;font-size:14px}
        .bank-summary{padding:12px 14px;background:#f5f6f7;border-radius:12px;margin:12px 0;font-size:13px}.bank-summary b{display:block;margin-bottom:4px}
        .contract-card{padding:18px 20px;display:flex;align-items:center;justify-content:space-between;gap:18px}.contract-status{font-weight:900;margin-top:5px}.status-ok{color:#008254}.status-warn{color:#b26a00}
        table{width:100%;border-collapse:collapse}th,td{padding:13px 14px;text-align:left;border-top:1px solid #eef0f2;font-size:13px}th{background:#f8f9fa;color:#68707d;border-top:0}
        .activity{overflow:hidden}.empty{padding:24px;color:#6d7480}
        .error{margin:0 0 16px;padding:12px 14px;border-radius:10px;background:#fff1f2;color:#b42318;font-size:13px}
        .toast{position:fixed;right:24px;bottom:24px;background:#111;color:#fff;padding:12px 16px;border-radius:10px;font-weight:700;z-index:50}
        @media(max-width:900px){.hero,.payout-grid{grid-template-columns:1fr}.product-grid{grid-template-columns:1fr 1fr}.asset-grid{grid-template-columns:1fr}.amount{font-size:46px}}
        @media(max-width:640px){.topbar{height:auto;padding:14px 16px;align-items:flex-start}.brand{font-size:17px}.top-actions{flex-wrap:wrap;justify-content:flex-end}.container{padding:18px 14px}.welcome{align-items:flex-start}.welcome h1{font-size:24px}.earnings,.sharebox,.panel{padding:18px}.amount{font-size:42px}.stats{grid-template-columns:1fr 1fr}.product-grid{grid-template-columns:1fr}.reward-grid{grid-template-columns:1fr 1fr}.section h2{font-size:20px}.share-top{grid-template-columns:1fr 100px}.qr{width:100px;height:100px}table{min-width:620px}.activity{overflow-x:auto}}
      `}</style>

      <header className="topbar">
        <div className="brand"><span>OPPO</span> AUSTRIA · REFERRAL</div>
        <div className="top-actions">
          <select className="btn" value={lang} onChange={e => changeLang(e.target.value as Lang)}>
            <option value="de">DE</option><option value="en">EN</option><option value="zh">中文</option>
          </select>
          <button className="btn" onClick={() => void logout()}>{t.logout}</button>
        </div>
      </header>

      <main className="container">
        {error ? <div className="error">{error}</div> : null}
        <div className="welcome">
          <div>
            <h1>{t.title}</h1>
            <div className="muted">{[profile.first_name, profile.last_name].filter(Boolean).join(" ") || profile.email} · {dashboard.currentTier}</div>
          </div>
        </div>

        <section className="hero">
          <div className="card earnings">
            <div className="eyebrow">{t.earned}</div>
            <div className="amount">{money(payout.withdrawable, lang)}</div>
            <div className="muted">{t.available}</div>
            <div className="stats">
              <div className="stat"><span className="muted">{t.total}</span><b>{money(dashboard.totalRewardAmount, lang)}</b></div>
              <div className="stat"><span className="muted">{t.pending}</span><b>{money(pendingReward, lang)}</b></div>
              <div className="stat"><span className="muted">{t.success}</span><b>{dashboard.successfulReferrals}</b></div>
            </div>
          </div>

          <div className="card sharebox">
            <div className="share-top">
              <div>
                <div className="eyebrow">{t.link}</div>
                <div style={{ fontSize: 28, fontWeight: 900, margin: "8px 0 14px" }}>{dashboard.referralCode}</div>
                <div className="code">{dashboard.referralLink}</div>
              </div>
              <img className="qr" src="/api/referral/qr" alt={t.qr} />
            </div>
            <div className="row" style={{ marginTop: 18 }}>
              <button className="btn btn-primary" onClick={() => void copy(dashboard.referralLink)}>{t.copyLink}</button>
              <button className="btn btn-dark" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(dashboard.referralLink)}`, "_blank")}>{t.whatsapp}</button>
              <a className="btn" href="/api/referral/qr?download=1">{t.downloadQr}</a>
            </div>
          </div>
        </section>

        <section className="card contract-card">
          <div>
            <div className="eyebrow">{t.contract}</div>
            <div className={`contract-status ${agreement.contractComplete ? "status-ok" : "status-warn"}`}>
              {agreement.contractComplete
                ? t.contractComplete
                : agreement.agreement?.status === "paper_requested"
                  ? t.contractPaper
                  : agreement.agreement?.status === "submitted"
                    ? t.contractSubmitted
                    : t.contractNotStarted}
            </div>
            <div className="muted" style={{fontSize:12,marginTop:5}}>{t.contractHelp}</div>
          </div>
          <button className="btn" onClick={()=>window.location.assign("/agreement")}>{t.contractOpen}</button>
        </section>

        <section className="section">
          <div className="section-head"><div><h2>{t.products}</h2><div className="muted">{t.productsHelp}</div></div></div>
          <div className="product-grid">
            {program.products.map(p => {
              const name = [p.model_name, p.variant].filter(Boolean).join(" · ");
              return <div className="card product-card" key={p.id}>
                <div style={{ fontSize: 11, color: "#7a8089", fontFamily: "monospace" }}>{p.sku || ""}</div>
                <div className="product-title">{name}</div>
                <div className="reward-grid">
                  <div className="reward-box"><small>{t.myReward}</small><b>+{money(p.referrer_reward, lang, p.currency)}</b></div>
                  <div className="reward-box secondary"><small>{t.friendBenefit}</small><b>{money(p.friend_discount, lang, p.currency)}</b></div>
                </div>
                {p.retail_price != null ? <div className="muted" style={{ fontSize: 12, marginTop: 10 }}>{t.rrp} {money(p.retail_price, lang, p.currency)}</div> : null}
                <div className="product-copy">{local(p, "copy")}</div>
                <button className="btn btn-primary" onClick={() => void copy(productShareText(p))}>{t.copyProduct}</button>
              </div>;
            })}
          </div>
        </section>

        <section className="section">
          <div className="section-head"><div><h2>{t.assets}</h2><div className="muted">{t.assetsHelp}</div></div></div>
          <div className="asset-grid">
            {program.assets.map(a => <div className="card asset-card" key={a.id}>
              {a.asset_url && ["image","banner"].includes(a.asset_type) ? <img src={a.asset_url} alt={local(a, "title")} style={{width:"100%",height:220,objectFit:"cover",borderRadius:12,border:"1px solid #e5e7eb",background:"#f8f9fa",marginBottom:14}} /> : null}\n              <div className="asset-type">{a.asset_type}</div>
              <div className="asset-title">{local(a, "title")}</div>
              <div className="asset-copy">{local(a, "copy")}</div>
              <div className="row" style={{ marginTop: 16 }}>
                <button className="btn btn-primary" onClick={() => void shareAsset(a)}>{t.shareAsset}</button>
                <button className="btn btn-dark" onClick={() => void copy(assetShareText(a))}>{t.copyAll}</button>
                {a.asset_url && ["image","banner"].includes(a.asset_type) ? <button className="btn" onClick={() => void downloadAsset(a)}>{t.downloadImage}</button> : null}
                {a.asset_url ? <button className="btn" onClick={() => window.open(a.asset_url!, "_blank", "noopener")}>{t.openAsset}</button> : null}
              </div>
            </div>)}
            {!program.assets.length ? <div className="empty">{t.noAssets}</div> : null}
          </div>
        </section>

        <section className="section" id="payout">
          <div className="section-head"><div><h2>{t.payout}</h2><div className="muted">{t.payoutHelp}</div></div></div>
          <div className="payout-grid">
            <div className="card panel">
              <div className="eyebrow">{t.savedBank}</div>
              {payout.account ? <div className="bank-summary">
                <b>{payout.account.accountHolder}</b>
                <div style={{ fontFamily: "monospace" }}>{payout.account.ibanMasked}</div>
                {payout.account.bic ? <div>BIC: {payout.account.bic}</div> : null}
              </div> : <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>—</div>}
              <div className="field"><label>{t.holder}</label><input value={bankDraft.accountHolder} onChange={e=>setBankDraft(x=>({...x,accountHolder:e.target.value}))}/></div>
              <div className="field"><label>{t.iban}</label><input autoComplete="off" placeholder={payout.account?.ibanMasked || "AT…"} value={bankDraft.iban} onChange={e=>setBankDraft(x=>({...x,iban:e.target.value}))}/></div>
              <div className="field"><label>{t.bic}</label><input autoComplete="off" value={bankDraft.bic} onChange={e=>setBankDraft(x=>({...x,bic:e.target.value}))}/></div>
              <button className="btn btn-primary" style={{ width:"100%", marginTop:14 }} disabled={busy==="bank" || !bankDraft.accountHolder || (!payout.account && !bankDraft.iban)} onClick={()=>void saveBank()}>{t.saveBank}</button>
            </div>

            <div className="card panel">
              <div className="eyebrow">{t.available}</div>
              <div style={{ fontSize:42,fontWeight:900,margin:"6px 0" }}>{money(payout.withdrawable, lang)}</div>
              <div className="muted" style={{ fontSize:13 }}>{payout.account?.ibanMasked || t.payoutHelp}</div>
              <button className="btn btn-dark" style={{ width:"100%",marginTop:16 }} disabled={busy==="payout" || !payout.account || payout.withdrawable<=0} onClick={()=>void requestPayout()}>{t.requestPayout}</button>
              {payout.withdrawable<=0 ? <div className="muted" style={{fontSize:12,marginTop:10}}>{t.noBalance}</div> : null}
              <div style={{ marginTop:22,fontWeight:900 }}>{t.payoutHistory}</div>
              {payout.requests.length ? <div style={{overflowX:"auto",marginTop:10}}>
                <table>
                  <thead><tr><th>{t.requestedAt}</th><th>{t.amount}</th><th>{t.payoutStatus}</th></tr></thead>
                  <tbody>{payout.requests.map(r=><tr key={r.id}><td>{new Date(r.requested_at).toLocaleDateString()}</td><td style={{fontWeight:800}}>{money(r.amount,lang,r.currency)}</td><td>{payoutStatus(r.status,lang)}</td></tr>)}</tbody>
                </table>
              </div> : <div className="empty" style={{paddingLeft:0}}>{t.noPayouts}</div>}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="section-head"><div><h2>{t.activity}</h2></div></div>
          <div className="card activity">
            {referrals.length ? <table>
              <thead><tr><th>{t.contact}</th><th>{t.product}</th><th>{t.status}</th><th>{t.reward}</th><th>{t.date}</th></tr></thead>
              <tbody>{referrals.map(r => <tr key={r.id}>
                <td>{r.referredEmail || "—"}</td><td>{r.productName || "—"}</td><td>{r.status}</td>
                <td style={{ fontWeight: 800, color: "#008254" }}>{money(Number(r.reward || 0), lang)}</td>
                <td>{new Date(r.qualifiedAt || r.registeredAt || r.createdAt).toLocaleDateString()}</td>
              </tr>)}</tbody>
            </table> : <div className="empty">{t.noReferrals}</div>}
          </div>
        </section>
      </main>

      {notice ? <div className="toast">{notice}</div> : null}
    </div>
  );
}
