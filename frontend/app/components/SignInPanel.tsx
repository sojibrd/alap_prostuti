"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import type { MeResponse } from "../../../backend/src/api-types";
import { api } from "../services/api";
import { SITE } from "../site";
import { Button, Callout, Panel, PanelHeader } from "./ui";

// The slice of Google Identity Services this page uses
type GoogleId = {
  initialize(config: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    ux_mode?: "popup" | "redirect";
  }): void;
  renderButton(element: HTMLElement, options: Record<string, string | number>): void;
  disableAutoSelect(): void;
};
declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

type State =
  | { kind: "idle" }
  | { kind: "waiting"; slow: boolean }
  | { kind: "error"; message: string }
  | { kind: "signed-in"; me: MeResponse };

// After this long, say that the free server is probably waking up
const SLOW_AFTER_MS = 3_000;

export function SignInPanel() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [state, setState] = useState<State>({ kind: "idle" });

  const onCredential = useCallback(async ({ credential }: { credential: string }) => {
    setState({ kind: "waiting", slow: false });
    const slowTimer = setTimeout(() => setState({ kind: "waiting", slow: true }), SLOW_AFTER_MS);
    try {
      const session = await api.signIn(credential);
      const me = await api.me(session.token);
      setState({ kind: "signed-in", me });
    } catch {
      setState({ kind: "error", message: "ঢোকা গেল না। একটু পরে আবার চেষ্টা করুন।" });
    } finally {
      clearTimeout(slowTimer);
    }
  }, []);

  useEffect(() => {
    const google = window.google;
    if (!scriptReady || !google || !buttonRef.current) return;
    google.accounts.id.initialize({ client_id: SITE.googleClientId, callback: onCredential, ux_mode: "popup" });
    google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      text: "signin_with",
      locale: "bn",
    });
  }, [scriptReady, onCredential, state.kind]);

  const signOut = () => {
    window.google?.accounts.id.disableAutoSelect();
    setState({ kind: "idle" });
  };

  return (
    <Panel className="w-full max-w-md p-5">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      <PanelHeader label="ঢুকুন" />
      <h1 className="t-title text-xl mb-2">{SITE.title}</h1>
      <p className="t-body mb-4">{SITE.description}</p>

      {state.kind === "signed-in" ? (
        <div className="flex flex-col gap-3">
          <p className="t-body">ঢোকা হয়েছে।</p>
          <div className="surface-well p-3 flex flex-col gap-1">
            <span className="t-label">আপনার Google id</span>
            <span className="t-mono break-all">{state.me.googleSub}</span>
          </div>
          {!state.me.isOwner && (
            <p className="t-caption t-muted">
              আপনি এই app-এর মালিক হলে উপরের id-টা Render-এর OWNER_GOOGLE_SUB-এ বসান।
            </p>
          )}
          <Button onClick={signOut}>বের হোন</Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div ref={buttonRef} className="min-h-11" />
          {state.kind === "waiting" && (
            <p className="t-caption t-muted" role="status">
              {state.slow ? "server জাগছে — প্রথমবার এক মিনিট পর্যন্ত লাগতে পারে…" : "ঢুকছি…"}
            </p>
          )}
          {state.kind === "error" && (
            <Callout tone="alert" label="সমস্যা">
              <span role="alert">{state.message}</span>
            </Callout>
          )}
        </div>
      )}
    </Panel>
  );
}
