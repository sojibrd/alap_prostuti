"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { isUuid } from "../services/uuid";
import { AccountPanel } from "./AccountPanel";
import { PreparationEditor } from "./PreparationEditor";
import { PreparationList } from "./PreparationList";
import { SignedIn } from "./SignedIn";
import { Callout } from "./ui";

// One client screen per page: pages stay server components and only place these

export function HomeScreen() {
  return <SignedIn>{(token) => <PreparationList token={token} />}</SignedIn>;
}

export function AccountScreen() {
  return <SignedIn>{(token) => <AccountPanel token={token} />}</SignedIn>;
}

// The id lives in ?id= because a static export can't pre-build a page per id
export function PreparationScreen() {
  const id = useSearchParams().get("id");
  return (
    <SignedIn>
      {(token) =>
        isUuid(id) ? (
          <PreparationEditor key={id} token={token} id={id} />
        ) : (
          <Callout tone="alert" label="পাওয়া যায়নি">
            এই লিংকে কোনো প্রস্তুতি নেই। <Link href="/" className="t-accent">তালিকায় ফিরুন</Link>
          </Callout>
        )
      }
    </SignedIn>
  );
}
