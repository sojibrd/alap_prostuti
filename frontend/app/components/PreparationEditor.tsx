"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { PreparationFields } from "../../../backend/src/api-types";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { clearSession } from "../hooks/useSession";
import { api, ApiError, isSignedOutError } from "../services/api";
import { Button, Callout, Panel, PanelHeader } from "./ui";

const EMPTY: PreparationFields = { want: "", openingLine: "", theirReply: "", myReply: "", outcome: null };
const MAX_LENGTH = 2000;
const SLOW_AFTER_MS = 3_000;

// The four fields before the conversation, in the order you think them through
const BEFORE: { key: "want" | "openingLine" | "theirReply" | "myReply"; label: string; hint: string }[] = [
  { key: "want", label: "আমি কী চাই", hint: "এই আলাপ থেকে আমি কী পেতে চাই, এক-দুই বাক্যে।" },
  { key: "openingLine", label: "আমার প্রথম বাক্য", hint: "শুরুতেই ঠিক কী বলব।" },
  { key: "theirReply", label: "অন্যজন কী বলতে পারেন", hint: "সবচেয়ে কঠিন যে উত্তরটা আসতে পারে।" },
  { key: "myReply", label: "তখন আমি কী বলব", hint: "ঐ উত্তরের জবাবে আমার বাক্য।" },
];

type Load = { kind: "loading"; slow: boolean } | { kind: "error" } | { kind: "ready"; saved: PreparationFields | null };
type Save = { kind: "idle" } | { kind: "saving"; slow: boolean } | { kind: "saved" } | { kind: "failed" };

export function PreparationEditor({ token, id }: { token: string; id: string }) {
  const router = useRouter();
  // Text not yet confirmed by the server stays in this browser until it is
  const [draft, setDraft] = useLocalStorage<PreparationFields | null>(`alap:draft:${id}`, null);
  const [load, setLoad] = useState<Load>({ kind: "loading", slow: false });
  const [save, setSave] = useState<Save>({ kind: "idle" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    const slowTimer = setTimeout(() => active && setLoad({ kind: "loading", slow: true }), SLOW_AFTER_MS);
    api
      .get(token, id)
      .then((p) => {
        if (!active) return;
        setLoad({
          kind: "ready",
          saved: { want: p.want, openingLine: p.openingLine, theirReply: p.theirReply, myReply: p.myReply, outcome: p.outcome },
        });
      })
      .catch((err) => {
        if (isSignedOutError(err)) {
          clearSession();
          return;
        }
        if (!active) return;
        // Not on the server yet: a new preparation
        if (err instanceof ApiError && err.status === 404) setLoad({ kind: "ready", saved: null });
        else setLoad({ kind: "error" });
      })
      .finally(() => clearTimeout(slowTimer));
    return () => {
      active = false;
      clearTimeout(slowTimer);
    };
  }, [token, id, attempt]);

  if (load.kind !== "ready") {
    return (
      <Panel className="p-4">
        {load.kind === "loading" ? (
          <p className="t-caption" role="status">
            {load.slow ? "server জাগছে — প্রথমবার এক মিনিট পর্যন্ত লাগতে পারে…" : "আনছি…"}
          </p>
        ) : (
          <Callout tone="alert" label="সমস্যা">
            <span role="alert">প্রস্তুতিটা আনা গেল না।</span>{" "}
            <Button onClick={() => setAttempt((n) => n + 1)}>আবার চেষ্টা করুন</Button>
          </Callout>
        )}
      </Panel>
    );
  }

  const fields = draft ?? load.saved ?? EMPTY;
  const isNew = load.saved === null;
  const update = (patch: Partial<PreparationFields>) => {
    setDraft({ ...fields, ...patch });
    setSave({ kind: "idle" });
  };

  const onSave = async () => {
    setSave({ kind: "saving", slow: false });
    const slowTimer = setTimeout(() => setSave({ kind: "saving", slow: true }), SLOW_AFTER_MS);
    try {
      const saved = await api.save(token, id, fields);
      setLoad({
        kind: "ready",
        saved: { want: saved.want, openingLine: saved.openingLine, theirReply: saved.theirReply, myReply: saved.myReply, outcome: saved.outcome },
      });
      setDraft(null);
      setSave({ kind: "saved" });
    } catch (err) {
      if (isSignedOutError(err)) clearSession();
      else setSave({ kind: "failed" });
    } finally {
      clearTimeout(slowTimer);
    }
  };

  const onDelete = async () => {
    if (!window.confirm("এই প্রস্তুতিটা মুছে ফেলবেন? ফেরানো যাবে না।")) return;
    try {
      if (!isNew) await api.remove(token, id);
      setDraft(null);
      router.push("/");
    } catch (err) {
      if (isSignedOutError(err)) clearSession();
      else setSave({ kind: "failed" });
    }
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        void onSave();
      }}
    >
      <Panel className="flex flex-col gap-4 p-4">
        <PanelHeader label={isNew ? "নতুন প্রস্তুতি" : "প্রস্তুতি"} />
        {draft && !isNew && (
          <p className="t-caption">এই browser-এ না পাঠানো লেখা আছে — দেখে নিয়ে সংরক্ষণ করুন।</p>
        )}
        {BEFORE.map(({ key, label, hint }) => (
          <div key={key} className="flex flex-col gap-1">
            <label htmlFor={`field-${key}`} className="t-strong">
              {label}
            </label>
            <span id={`hint-${key}`} className="t-caption">
              {hint}
            </span>
            <textarea
              id={`field-${key}`}
              aria-describedby={`hint-${key}`}
              className="surface-well t-body min-h-24 w-full resize-y p-3"
              maxLength={MAX_LENGTH}
              value={fields[key]}
              onChange={(event) => update({ [key]: event.target.value })}
            />
          </div>
        ))}
      </Panel>

      <Panel className="flex flex-col gap-1 p-4">
        <label htmlFor="field-outcome" className="t-strong">
          আলাপের পরে: কী হলো
        </label>
        <span id="hint-outcome" className="t-caption">
          আলাপ শেষে এক লাইনে। আগে থেকে খালি রাখুন।
        </span>
        <input
          id="field-outcome"
          aria-describedby="hint-outcome"
          className="surface-well t-body w-full p-3"
          maxLength={MAX_LENGTH}
          value={fields.outcome ?? ""}
          onChange={(event) => update({ outcome: event.target.value === "" ? null : event.target.value })}
        />
      </Panel>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="control control--primary px-4 py-2 text-sm" disabled={save.kind === "saving"}>
          সংরক্ষণ করুন
        </button>
        <Button variant="alert" onClick={onDelete}>
          মুছে ফেলুন
        </Button>
        <span className="t-caption" role="status">
          {save.kind === "saving" && (save.slow ? "server জাগছে — এক মিনিট পর্যন্ত লাগতে পারে…" : "সংরক্ষণ হচ্ছে…")}
          {save.kind === "saved" && "সংরক্ষিত।"}
        </span>
      </div>

      {save.kind === "failed" && (
        <Callout tone="alert" label="সংরক্ষণ হয়নি">
          <span role="alert">লেখা এই browser-এ রাখা আছে, হারায়নি। একটু পরে আবার “সংরক্ষণ করুন” চাপুন।</span>
        </Callout>
      )}
    </form>
  );
}
