import type { Metadata } from "next";
import { Noto_Sans_Bengali } from "next/font/google";
import { SITE } from "./site";
import "./globals.css";

// The only family the site downloads (Core Web Vitals): Bengali with Latin,
// regular and bold. Themes reach it through --font-bengali.
const bengali = Noto_Sans_Bengali({
  variable: "--font-bengali",
  weight: ["400", "700"],
  subsets: ["bengali", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: SITE.title,
  description: SITE.description,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="bn" className={`${bengali.variable} h-full antialiased`}>
      <body className="surface-app flex min-h-full flex-col">{children}</body>
    </html>
  );
}
