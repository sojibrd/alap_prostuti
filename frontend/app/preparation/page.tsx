import type { Metadata } from "next";
import { Suspense } from "react";
import { PreparationScreen } from "../components/screens";

export const metadata: Metadata = { title: "প্রস্তুতি — আলাপের প্রস্তুতি" };

// useSearchParams needs a Suspense boundary in a static export
export default function PreparationPage() {
  return (
    <Suspense fallback={null}>
      <PreparationScreen />
    </Suspense>
  );
}
