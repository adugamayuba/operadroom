import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Operadroom — Autonomous Execution for Industrial Digital Twins",
  description:
    "Operadroom turns predictive asset alerts into completed maintenance workflows. An enterprise agent layer for oil & gas, chemicals, and heavy industry.",
  openGraph: {
    title: "Operadroom",
    description: "From predictive alert to completed work order. Autonomously.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
