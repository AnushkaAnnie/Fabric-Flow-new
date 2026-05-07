import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Fabric Flow | Textile Production Platform",
  description:
    "End-to-end textile manufacturing tracker — from yarn to finished fabric. Track yarn lots, knitting, dyeing, and compacting in real time.",
  keywords: ["textile", "fabric", "manufacturing", "yarn", "knitting", "dyeing"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased bg-[#080c14] text-slate-100`}>
        {children}
        <Toaster theme="dark" position="top-right" richColors />
      </body>
    </html>
  );
}
