import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import { DemoThemeProvider } from "@/components/demo/DemoThemeProvider";

const ibm = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-demo",
});

export const metadata: Metadata = {
  title: "Pilot Simulator — Operadroom",
  description:
    "Interactive sandbox demonstrating closed-loop maintenance execution from digital twin alert to SAP work order draft.",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={ibm.className}>
      <DemoThemeProvider>{children}</DemoThemeProvider>
    </div>
  );
}
