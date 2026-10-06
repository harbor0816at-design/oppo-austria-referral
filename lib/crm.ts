export type CrmCustomer = {
  id: string;
  full_name: string;
  whatsapp?: string | null;
  phone_norm?: string | null;
  email?: string | null;
  state: string;
  lead_score: number;
  temperature: "cold" | "warm" | "hot";
  product_interest_text?: string | null;
  purchase_barrier?: string | null;
  next_action?: string | null;
  next_action_due?: string | null;
};

export function normalizeEmail(value?: string | null) {
  return String(value || "").trim().toLowerCase();
}

export function normalizePhone(value?: string | null) {
  let v = String(value || "").replace(/[^0-9]/g, "");
  if (v.startsWith("00")) v = v.slice(2);
  return v;
}

export function deriveTemperature(score: number): "cold" | "warm" | "hot" {
  if (score >= 70) return "hot";
  if (score >= 40) return "warm";
  return "cold";
}

export function scoreOrderMatch(
  customer: CrmCustomer,
  order: { email?: string | null; phone?: string | null; customer_name?: string | null }
) {
  const cEmail = normalizeEmail(customer.email);
  const oEmail = normalizeEmail(order.email);
  const cPhone = normalizePhone(customer.phone_norm || customer.whatsapp);
  const oPhone = normalizePhone(order.phone);
  const cName = customer.full_name.trim().toLowerCase().replace(/\s+/g, " ");
  const oName = String(order.customer_name || "").trim().toLowerCase().replace(/\s+/g, " ");

  if (cEmail && oEmail && cEmail === oEmail) return { score: 100, reason: "email_exact" };
  if (cPhone && oPhone && cPhone === oPhone) return { score: 100, reason: "phone_exact" };
  if (cPhone.length >= 8 && oPhone.length >= 8 && cPhone.slice(-8) === oPhone.slice(-8)) {
    return { score: 88, reason: "phone_last8" };
  }
  if (cName && oName && cName === oName && (cEmail || cPhone)) return { score: 78, reason: "name_exact" };
  if (cName && oName && cName === oName) return { score: 68, reason: "name_only" };
  return { score: 0, reason: "none" };
}

function parseLine(line: string, delimiter: string) {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { cur += '"'; i++; }
      else quoted = !quoted;
    } else if (ch === delimiter && !quoted) {
      out.push(cur.trim()); cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur.trim());
  return out;
}

export function parseCsv(text: string) {
  const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").filter(x => x.trim().length);
  if (!lines.length) return [];
  const first = lines[0];
  const candidates = [",", ";", "\t"];
  const delimiter = candidates
    .map(d => ({ d, n: parseLine(first, d).length }))
    .sort((a,b) => b.n - a.n)[0].d;
  const headers = parseLine(first, delimiter).map(x => x.trim());
  return lines.slice(1).map(line => {
    const cells = parseLine(line, delimiter);
    const row: Record<string,string> = {};
    headers.forEach((h,i) => { row[h] = cells[i] ?? ""; });
    return row;
  });
}

const aliases: Record<string,string[]> = {
  order_number: ["order number","order no","order_no","order id","order","bestellnummer","订单号"],
  order_date: ["order date","date","bestelldatum","bestelldatum","订单日期"],
  customer_name: ["customer name","customer","name","buyer","kundenname","kunde","消费者姓名","姓名"],
  email: ["email","e-mail","buyer email","kunden email","邮箱"],
  phone: ["phone","telephone","tel","mobile","whatsapp","telefon","telefonnummer","手机号","电话"],
  product_name: ["product name","product","item","article","artikel","produkt","商品名称","商品"],
  quantity: ["quantity","qty","menge","数量"],
  gross_amount: ["gross amount","amount","total","gross sales","brutto","gesamt","销售额","金额"],
  net_amount: ["net amount","net sales","netto","净额"],
  currency: ["currency","währung","币种"],
  country: ["country","land","国家"],
  status: ["status","order status","订单状态"]
};

function canonicalHeader(value: string) {
  return value.toLowerCase().trim().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

export function mapOrderRow(row: Record<string,string>) {
  const normalized = Object.fromEntries(Object.entries(row).map(([k,v]) => [canonicalHeader(k), v]));
  const pick = (key: string) => {
    const names = aliases[key] || [];
    for (const n of names) if (normalized[canonicalHeader(n)] != null) return normalized[canonicalHeader(n)];
    return "";
  };
  const number = (v: string) => Number(String(v || "0").replace(/[^0-9,.-]/g,"").replace(",",".")) || 0;
  return {
    order_number: pick("order_number").trim(),
    order_date: pick("order_date").trim() || null,
    customer_name: pick("customer_name").trim() || null,
    email: normalizeEmail(pick("email")) || null,
    phone: pick("phone").trim() || null,
    phone_norm: normalizePhone(pick("phone")) || null,
    product_name: pick("product_name").trim() || null,
    quantity: Math.max(1, Math.round(number(pick("quantity")) || 1)),
    gross_amount: Math.max(0, number(pick("gross_amount"))),
    net_amount: pick("net_amount") ? Math.max(0, number(pick("net_amount"))) : null,
    currency: (pick("currency").trim() || "EUR").slice(0,3).toUpperCase(),
    country: pick("country").trim() || null,
    status: pick("status").trim() || "confirmed",
    raw_data: row,
  };
}
