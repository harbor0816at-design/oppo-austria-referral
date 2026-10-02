import QRCode from "qrcode";
import { requireUser } from "@/lib/auth";
import { getReferralDashboard } from "@/services/referral.service";

export async function GET(req: Request) {
  await requireUser();
  const dashboard = await getReferralDashboard();
  const url = new URL(req.url);
  const svg = await QRCode.toString(dashboard.referralLink, {
    type: "svg",
    width: 360,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#111111", light: "#FFFFFF" },
  });
  const download = url.searchParams.get("download") === "1";
  return new Response(svg, {
    status: 200,
    headers: {
      "content-type": "image/svg+xml; charset=utf-8",
      "cache-control": "private, no-store",
      "content-disposition": download ? 'attachment; filename="oppo-referral-qr.svg"' : "inline",
    },
  });
}
