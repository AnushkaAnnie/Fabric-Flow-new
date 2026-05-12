import type { Metadata } from "next";
import { Toaster } from "sonner";
import { Providers } from "./providers";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" className={cn("dark", "font-sans", geist.variable)}>
      <body
        suppressHydrationWarning
        className="font-sans antialiased bg-[#080c14] text-slate-100"
      >
        <Providers>{children}</Providers>
        <Toaster theme="dark" position="top-right" richColors />
      </body>
    </html>
  );
}
