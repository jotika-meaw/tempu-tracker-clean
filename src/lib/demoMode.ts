import { useEffect, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "tempu-tracker.demo-vehicles";
const listeners = new Set<() => void>();

function readStored(): boolean {
  try {
    // Demo vehicles are on unless the viewer turned them off.
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    return true;
  }
}

let enabled = typeof window === "undefined" ? true : readStored();

export function setDemoVehiclesEnabled(next: boolean): void {
  enabled = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  } catch {
    // The choice then lasts until the tab is closed.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Whether labelled demo vehicles are shown; shared by every view. */
export function useDemoVehiclesEnabled(): boolean {
  return useSyncExternalStore(subscribe, () => enabled, () => true);
}

/** A clock that ticks every `intervalMs` while `active` is true. */
export function useTickingNow(active: boolean, intervalMs = 1_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [active, intervalMs]);
  return now;
}
