"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useSession } from "../hooks/useSession";
import { SITE } from "../site";
import { SignInPanel } from "./SignInPanel";
import { Button } from "./ui";

// Every screen needs a session. Without one this shows the sign-in panel;
// with one, the top bar and the screen, which receives the token.
export function SignedIn({ children }: { children: (token: string) => ReactNode }) {
  const { session, signOut } = useSession();

  // Not read from storage yet: show nothing rather than a sign-in flash
  if (session === undefined) {
    return <main id="main-content" className="flex flex-1" aria-busy="true" />;
  }

  if (session === null) {
    return (
      <main id="main-content" className="flex flex-1 items-center justify-center p-4">
        <SignInPanel />
      </main>
    );
  }

  return (
    <>
      <header className="surface-panel flex items-center justify-between gap-3 px-4 py-2">
        <Link href="/" className="t-title text-base">
          {SITE.title}
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/account/" className="control control--quiet px-3 py-1.5 text-xs">
            আমার account
          </Link>
          <Button variant="ghost" onClick={signOut}>
            বের হোন
          </Button>
        </nav>
      </header>
      <main id="main-content" className="flex w-full max-w-2xl flex-1 flex-col gap-4 self-center p-4">
        {children(session.token)}
      </main>
    </>
  );
}
