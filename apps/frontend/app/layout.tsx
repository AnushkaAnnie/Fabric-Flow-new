import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Textile Flow | Chhavineetu Textiles LLP",
  description: "Production lifecycle tracker",
  keywords: [
    "textile",
    "fabric",
    "manufacturing",
    "yarn",
    "knitting",
    "dyeing",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased bg-[#080c14] text-slate-100">
        <Providers>{children}</Providers>
        <Toaster theme="dark" position="top-right" richColors />
      </body>
    </html>
  );
}
