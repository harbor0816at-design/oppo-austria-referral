import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "OPPO Austria Referral Portal",
  description: "Independent OPPO Austria Customer Referral Program"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="de"><body style={{ margin: 0, fontFamily: "Arial, sans-serif" }}>{children}</body></html>;
}
