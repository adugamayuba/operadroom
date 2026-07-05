"use client";

import { useCallback, useEffect, useState } from "react";
import { isAlertSoundEnabled, playAlertChime, setAlertSoundEnabled } from "@/lib/demo/alertSound";

export function useAlertSound() {
  const [enabled, setEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setEnabled(isAlertSoundEnabled());
    setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev;
      setAlertSoundEnabled(next);
      if (next) playAlertChime();
      return next;
    });
  }, []);

  const playIfEnabled = useCallback(() => {
    if (isAlertSoundEnabled()) playAlertChime();
  }, []);

  return { enabled: mounted ? enabled : false, toggle, playIfEnabled };
}
