import { useEffect } from "react";
import { initStoreSync, useStore } from "@/lib/store";

export function StoreHydrator() {
  useEffect(() => {
    initStoreSync();
    const tick = setInterval(() => {
      // force re-render in case localStorage was updated by another tab
      // (BroadcastChannel covers most cases — this is a safety net)
      useStore.setState((s) => ({ ...s }));
    }, 1500);
    return () => clearInterval(tick);
  }, []);
  return null;
}
