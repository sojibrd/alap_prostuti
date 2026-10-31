"use client";

import { useCallback, useRef, useSyncExternalStore } from "react";

const snapshotCache = new Map<string, { raw: string | null; parsed: unknown }>();
const listeners = new Map<string, Set<() => void>>();

function emit(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function subscribe(key: string, onChange: () => void) {
  let set = listeners.get(key);
  if (!set) {
    set = new Set();
    listeners.set(key, set);
  }
  set.add(onChange);

  const onStorage = (event: StorageEvent) => {
    if (event.key === key) onChange();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    set?.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function readSnapshot<T>(key: string, initialValue: T): T {
  if (typeof window === "undefined") return initialValue;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(key);
  } catch {
    // storage unavailable or privacy mode
  }

  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.parsed as T;

  let parsed: T = initialValue;
  if (raw !== null) {
    try {
      parsed = JSON.parse(raw) as T;
    } catch {
      // corrupt json fallback
    }
  }
  snapshotCache.set(key, { raw, parsed });
  return parsed;
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const initialRef = useRef(initialValue);

  const value = useSyncExternalStore(
    useCallback((onChange: () => void) => subscribe(key, onChange), [key]),
    useCallback(() => readSnapshot(key, initialRef.current), [key]),
    useCallback(() => initialRef.current, []),
  );

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const current = readSnapshot(key, initialRef.current);
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(current) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // quota exceeded
      }
      snapshotCache.set(key, {
        raw: JSON.stringify(resolved),
        parsed: resolved,
      });
      emit(key);
    },
    [key],
  );

  return [value, setValue] as const;
}

export default useLocalStorage;
