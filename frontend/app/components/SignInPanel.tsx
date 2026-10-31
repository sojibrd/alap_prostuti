"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "../hooks/useSession";
import { SITE } from "../site";
import { Callout, Panel, PanelHeader } from "./ui";

type State = { kind: "idle" } | { kind: "waiting"; slow: boolean } | { kind: "error" };

// After this long, say that the free server is probably waking up
const SLOW_AFTER_MS = 3_000;

export function SignInPanel() {
  const { signIn } = useSession();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [state, setState] = useState<State>({ kind: "idle" });

  const onCredential = useCallback(
    async ({ credential }: { credential: string }) => {
      setState({ kind: "waiting", slow: false });
      const slowTimer = setTimeout(() => setState({ kind: "waiting", slow: true }), SLOW_AFTER_MS);
      try {
        await signIn(credential);
      } catch {
        setState({ kind: "error" });
      } finally {
        clearTimeout(slowTimer);
      }
    },
    [signIn],
  );

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
  }, [scriptReady, onCredential]);

  return (
    <Panel className="w-full max-w-md p-5">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onReady={() => setScriptReady(true)} />
      <PanelHeader label="ঢুকুন" />
      <h1 className="t-title text-xl mb-2">{SITE.title}</h1>
      <p className="t-body mb-4">{SITE.description}</p>
      <div className="flex flex-col gap-3">
        <div ref={buttonRef} className="min-h-11" />
        {state.kind === "waiting" && (
          <p className="t-caption" role="status">
            {state.slow ? "server জাগছে — প্রথমবার এক মিনিট পর্যন্ত লাগতে পারে…" : "ঢুকছি…"}
          </p>
        )}
        {state.kind === "error" && (
          <Callout tone="alert" label="সমস্যা">
            <span role="alert">ঢোকা গেল না। একটু পরে আবার চেষ্টা করুন।</span>
          </Callout>
        )}
      </div>
    </Panel>
  );
}
