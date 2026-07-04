import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pilot Simulator — Operadroom",
  description:
    "Interactive sandbox demonstrating closed-loop maintenance execution from digital twin alert to SAP work order draft.",
  openGraph: {
    title: "Operadroom Pilot Simulator",
    description: "Rheinland refinery sandbox — telemetry to work order in seconds.",
  },
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return children;
}
