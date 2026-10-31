"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { PreparationSummary } from "../../../backend/src/api-types";
import { clearSession } from "../hooks/useSession";
import { api, isSignedOutError } from "../services/api";
import { uuidv7 } from "../services/uuid";
import { Badge, Button, Callout, Panel, PanelHeader } from "./ui";

type State =
  | { kind: "loading"; slow: boolean }
  | { kind: "error" }
  | { kind: "ready"; items: PreparationSummary[] };

const SLOW_AFTER_MS = 3_000;
const dateFormat = new Intl.DateTimeFormat("bn-BD", { dateStyle: "medium" });

export function PreparationList({ token }: { token: string }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "loading", slow: false });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const slowTimer = setTimeout(() => active && setState({ kind: "loading", slow: true }), SLOW_AFTER_MS);
    api
      .list(token)
      .then((response) => active && setState({ kind: "ready", items: response.preparations }))
      .catch((err) => {
        if (isSignedOutError(err)) clearSession();
        else if (active) setState({ kind: "error" });
      })
      .finally(() => clearTimeout(slowTimer));
    return () => {
      active = false;
      clearTimeout(slowTimer);
    };
  }, [token, attempt]);

  const startNew = () => router.push(`/preparation/?id=${uuidv7()}`);

  return (
    <Panel className="p-4">
      <PanelHeader label="আমার প্রস্তুতি" right={<Button variant="primary" onClick={startNew}>নতুন প্রস্তুতি</Button>} />

      {state.kind === "loading" && (
        <p className="t-caption" role="status">
          {state.slow ? "server জাগছে — প্রথমবার এক মিনিট পর্যন্ত লাগতে পারে…" : "আনছি…"}
        </p>
      )}

      {state.kind === "error" && (
        <Callout tone="alert" label="সমস্যা">
          <span role="alert">তালিকা আনা গেল না।</span>{" "}
          <Button onClick={() => setAttempt((n) => n + 1)}>আবার চেষ্টা করুন</Button>
        </Callout>
      )}

      {state.kind === "ready" && state.items.length === 0 && (
        <p className="t-body">
          এখনো কোনো প্রস্তুতি নেই। সামনে কোনো কঠিন আলাপ থাকলে “নতুন প্রস্তুতি” দিয়ে শুরু করুন।
        </p>
      )}

      {state.kind === "ready" && state.items.length > 0 && (
        <ul className="flex flex-col">
          {state.items.map((item) => (
            <li key={item.id} className="seam-b">
              <Link href={`/preparation/?id=${item.id}`} className="row flex items-center justify-between gap-3 px-2 py-3">
                <span className="t-body truncate">{item.title || "(শিরোনাম নেই)"}</span>
                <span className="flex shrink-0 items-center gap-2">
                  {item.hasOutcome && <Badge tone="confirm">পরে লেখা হয়েছে</Badge>}
                  <span className="t-caption">{dateFormat.format(new Date(item.createdAt))}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
