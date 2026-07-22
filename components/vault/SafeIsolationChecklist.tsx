"use client";

import { useState } from "react";
import { SAFE_ISOLATION_STEPS } from "@/lib/vault/queries";

export function SafeIsolationChecklist() {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  return (
    <div className="mt-3 border border-white/15 bg-black p-3">
      <p className="vault-label mb-2">Safe Isolation checklist · P-2047</p>
      <ol className="space-y-2">
        {SAFE_ISOLATION_STEPS.map((step, i) => {
          const done = checked.has(i);
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() =>
                  setChecked((prev) => {
                    const next = new Set(prev);
                    if (next.has(i)) next.delete(i);
                    else next.add(i);
                    return next;
                  })
                }
                className={`flex gap-2.5 w-full text-left text-[13px] leading-snug transition-colors ${
                  done ? "text-white/90" : "text-white/55 hover:text-white/75"
                }`}
              >
                <span
                  className={`shrink-0 w-4 h-4 mt-0.5 border flex items-center justify-center text-[10px] font-mono ${
                    done ? "border-white bg-white text-black" : "border-white/25 text-white/50"
                  }`}
                >
                  {done ? "✓" : i + 1}
                </span>
                <span>
                  <span className="font-mono text-white/70">{step.tag}</span>
                  <span className="block mt-0.5">{step.action}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <p className="text-[11px] font-mono text-white/30 mt-3 uppercase tracking-wider">
        AM-05 · permit holder + execution engineer sign-off required
      </p>
    </div>
  );
}
