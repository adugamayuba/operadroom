import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

const SITE_URL = "https://operadroom.reelin.ai";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Operadroom — Autonomous Execution for Industrial Digital Twins",
  description:
    "Operadroom turns predictive asset alerts into completed maintenance workflows. An enterprise agent layer for oil & gas, chemicals, and heavy industry.",
  applicationName: "Operadroom",
  icons: {
    icon: [{ url: "/brand/logo-mark.svg", type: "image/svg+xml" }],
    apple: [{ url: "/brand/logo-mark.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "Operadroom — Autonomous Execution for Industrial Digital Twins",
    description: "From predictive alert to completed work order. Autonomously.",
    url: SITE_URL,
    siteName: "Operadroom",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Operadroom — Autonomous Execution for Industrial Digital Twins",
    description: "From predictive alert to completed work order. Autonomously.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
