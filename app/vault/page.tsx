import type { Metadata } from "next";
import { Roboto_Condensed } from "next/font/google";
import { DemoThemeProvider } from "@/components/demo/DemoThemeProvider";
import { VaultConsole } from "@/components/vault/VaultConsole";

const vaultFont = Roboto_Condensed({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-demo",
});

export const metadata: Metadata = {
  title: "Plant Memory — Operadroom Vault",
  description:
    "Legacy records digitization and AI search for industrial facilities — Rheinland archive demo.",
  robots: { index: false, follow: false },
};

export default function VaultPage() {
  return (
    <div className={`${vaultFont.variable} ${vaultFont.className} demo-root`} data-demo-theme="dark">
      <DemoThemeProvider>
        <VaultConsole />
      </DemoThemeProvider>
    </div>
  );
}
