"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { SignInResponse } from "../../../backend/src/api-types";
import { api } from "../services/api";

// Kept in localStorage: every tab shares one sign-in, and it outlives closing
// the browser until the token's one hour runs out. On a shared phone, signing
// out is how you end it; that signs out every open tab too.
const KEY = "alap:session";

type Session = SignInResponse;

const listeners = new Set<() => void>();
let cache: { raw: string | null; value: Session | null } = { raw: null, value: null };

function readStored(): Session | null {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    // Storage blocked; behave as signed out
  }
  if (raw !== cache.raw) {
    let value: Session | null = null;
    try {
      value = raw ? (JSON.parse(raw) as Session) : null;
    } catch {
      // Corrupt entry; treat as signed out
    }
    cache = { raw, value };
  }
  return cache.value;
}

function snapshot(): Session | null {
  const session = readStored();
  return session && session.expiresAt * 1000 > Date.now() ? session : null;
}

function write(session: Session | null) {
  try {
    if (session) window.localStorage.setItem(KEY, JSON.stringify(session));
    else window.localStorage.removeItem(KEY);
  } catch {
    // Storage blocked; the session lives only until this render
  }
  listeners.forEach((listener) => listener());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab signed in or out
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY || event.key === null) onChange();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

// For a 401 from the API: the token expired or the account is gone
export function clearSession() {
  write(null);
}

// The static HTML is built without a browser, so before hydration the session
// is unknown (undefined), not absent (null). Showing sign-in for "unknown"
// made the sign-in panel flash on every page load.
const unknownOnServer = () => undefined;

export function useSession() {
  const session: Session | null | undefined = useSyncExternalStore(subscribe, snapshot, unknownOnServer);

  const signIn = useCallback(async (credential: string) => {
    write(await api.signIn(credential));
  }, []);

  const signOut = useCallback(() => {
    window.google?.accounts.id.disableAutoSelect();
    write(null);
  }, []);

  return { session, signIn, signOut };
}
