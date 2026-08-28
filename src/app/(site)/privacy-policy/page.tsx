import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { privacy_policy } from "@/lib/legal";

export const metadata: Metadata = {
  title: privacy_policy.title,
  description: privacy_policy.description,
};

export default function Page() {
  return <LegalPage doc={privacy_policy} />;
}
