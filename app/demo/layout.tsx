import type { Metadata } from "next";
import { Roboto_Condensed } from "next/font/google";
import { DemoThemeProvider } from "@/components/demo/DemoThemeProvider";

const demoFont = Roboto_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-demo",
});

export const metadata: Metadata = {
  title: "Pilot Simulator — Operadroom",
  description:
    "Interactive sandbox demonstrating closed-loop maintenance execution from digital twin alert to SAP work order draft.",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${demoFont.variable} ${demoFont.className}`}>
      <DemoThemeProvider>{children}</DemoThemeProvider>
    </div>
  );
}
