import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { return_refund_policy } from "@/lib/legal";

export const metadata: Metadata = {
  title: return_refund_policy.title,
  description: return_refund_policy.description,
};

export default function Page() {
  return <LegalPage doc={return_refund_policy} />;
}
