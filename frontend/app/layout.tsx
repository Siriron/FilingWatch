import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FilingWatch — SEC disclosure deadline monitor",
  description:
    "FilingWatch binds a recurring SEC disclosure obligation to a company's own EDGAR record. Independent validators fetch EDGAR directly and judge whether the required filing landed on time.",
  openGraph: {
    title: "FilingWatch — SEC disclosure deadline monitor",
    description:
      "Bounded obligations, checked against EDGAR's own record by independent validators. Fail-closed by design.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
