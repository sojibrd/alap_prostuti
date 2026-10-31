import type { Metadata } from "next";
import { AccountScreen } from "../components/screens";

export const metadata: Metadata = { title: "আমার account — আলাপের প্রস্তুতি" };

export default function AccountPage() {
  return <AccountScreen />;
}
