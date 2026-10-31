"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { SignInResponse } from "../../../backend/src/api-types";
import { api } from "../services/api";

// Kept in sessionStorage: it survives a reload, but closing the tab signs out,
// which matters on a shared phone. The token itself lasts an hour.
const KEY = "alap:session";

type Session = SignInResponse;

const listeners = new Set<() => void>();
let cache: { raw: string | null; value: Session | null } = { raw: null, value: null };

function readStored(): Session | null {
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(KEY);
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
    if (session) window.sessionStorage.setItem(KEY, JSON.stringify(session));
    else window.sessionStorage.removeItem(KEY);
  } catch {
    // Storage blocked; the session lives only until this render
  }
  listeners.forEach((listener) => listener());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => listeners.delete(onChange);
}

// For a 401 from the API: the token expired or the account is gone
export function clearSession() {
  write(null);
}

export function useSession() {
  const session = useSyncExternalStore(subscribe, snapshot, () => null);

  const signIn = useCallback(async (credential: string) => {
    write(await api.signIn(credential));
  }, []);

  const signOut = useCallback(() => {
    window.google?.accounts.id.disableAutoSelect();
    write(null);
  }, []);

  return { session, signIn, signOut };
}
