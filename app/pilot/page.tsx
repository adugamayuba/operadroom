import type { Metadata } from "next";
import { Roboto_Condensed } from "next/font/google";
import { DemoThemeProvider } from "@/components/demo/DemoThemeProvider";
import { PilotConsole } from "@/components/pilot/PilotConsole";

const pilotFont = Roboto_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-demo",
});

export const metadata: Metadata = {
  title: "Rheinland CDU-1 Pilot — Operadroom",
  description:
    "90-day pilot console for CDU-1 Safe Isolation & Maintenance Execution — 15 assets, historical replay, HITL release, OPEX metrics.",
  robots: { index: false, follow: false },
};

export default function PilotPage() {
  return (
    <div className={`${pilotFont.variable} ${pilotFont.className} demo-root`} data-demo-theme="dark">
      <DemoThemeProvider>
        <PilotConsole />
      </DemoThemeProvider>
    </div>
  );
}
