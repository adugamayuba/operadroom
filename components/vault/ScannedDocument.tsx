"use client";

import { FullPageDocument } from "@/components/vault/FullPageDocument";
import type { VaultDocument } from "@/lib/vault/corpus";

/** Citation viewer — full scanned page */
export function ScannedDocument({
  doc,
  autoScrollHighlight,
}: {
  doc: VaultDocument;
  autoScrollHighlight?: boolean;
}) {
  return (
    <FullPageDocument
      doc={doc}
      showOverlays={false}
      className={autoScrollHighlight ? "vault-page-in" : ""}
    />
  );
}
