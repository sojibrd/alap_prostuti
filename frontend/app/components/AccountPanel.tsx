"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { MeResponse } from "../../../backend/src/api-types";
import { clearSession } from "../hooks/useSession";
import { api, isSignedOutError } from "../services/api";
import { Button, Callout, Panel, PanelHeader } from "./ui";

export function AccountPanel({ token }: { token: string }) {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api
      .me(token)
      .then(setMe)
      .catch((err) => (isSignedOutError(err) ? clearSession() : setFailed(true)));
  }, [token]);

  const onDelete = async () => {
    if (!window.confirm("account আর সব প্রস্তুতি চিরতরে মুছে ফেলবেন? ফেরানো যাবে না।")) return;
    try {
      await api.deleteAccount(token);
      clearSession();
      router.push("/");
    } catch (err) {
      if (isSignedOutError(err)) clearSession();
      else setFailed(true);
    }
  };

  return (
    <>
      <Panel className="flex flex-col gap-2 p-4">
        <PanelHeader label="আপনার লেখা কোথায় থাকে" />
        <p className="t-body">
          আপনার প্রস্তুতি দেখতে পান শুধু আপনি — অন্য কোনো ব্যবহারকারী নয়। লেখা থাকে এই app-এর database-এ। সোজা কথা:
          database-এর মালিক চাইলে লেখাগুলো পড়তে পারেন, কিন্তু পড়েন না; তিনি দেখেন শুধু কে কয়টা প্রস্তুতি লিখেছেন, সেই সংখ্যা।
        </p>
        <p className="t-body">
          আমরা আপনার নাম বা ইমেইল রাখি না — শুধু Google-এর দেওয়া একটা id। প্রতিদিন database-এর একটা encrypt করা কপি রাখা হয়
          ৩০ দিনের জন্য, যাতে কিছু হারিয়ে না যায়।
        </p>
      </Panel>

      {me && (
        <Panel className="flex flex-col gap-1 p-4">
          <PanelHeader label="আপনার Google id" />
          <span className="t-mono break-all">{me.googleSub}</span>
          {me.isOwner && <span className="t-caption">আপনি এই app-এর মালিক।</span>}
        </Panel>
      )}

      <Panel className="flex flex-col gap-3 p-4">
        <PanelHeader label="account মুছে ফেলা" />
        <p className="t-body">
          মুছলে আপনার account আর সব প্রস্তুতি সাথে সাথে চলে যায়। দৈনিক কপি থেকেও ৩০ দিনের মধ্যে নিজে থেকে মুছে যায়।
        </p>
        <div>
          <Button variant="alert" onClick={onDelete}>
            account মুছে ফেলুন
          </Button>
        </div>
        {failed && (
          <Callout tone="alert" label="সমস্যা">
            <span role="alert">কাজটা করা গেল না। একটু পরে আবার চেষ্টা করুন।</span>
          </Callout>
        )}
      </Panel>
    </>
  );
}
