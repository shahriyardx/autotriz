import type { Metadata } from "next";
import { Newsletter } from "@/components/newsletter";
import { PageHero } from "@/components/page-hero";
import { Reveal } from "@/components/reveal";
import { Band, Button, Heading } from "@/components/ui";

export const metadata: Metadata = {
  title: "Resources",
  description:
    "Technical data sheets, safety data sheets, application guides and lab reports for the AUTOTRIZ automotive range.",
};

/* `onRequest` items are issued by the technical desk rather than being
   published as open downloads. */
const assets = [
  { t: "Application guides", d: "Step-by-step method for every coating in the range.", onRequest: false },
  { t: "Product photography", d: "Studio shots of every bottle, on white and on transparent.", onRequest: false },
  { t: "Brochures", d: "The automotive range brochure, print and screen versions.", onRequest: false },
  { t: "Brand files", d: "Wordmark, circle mark and clear-space rules.", onRequest: false },
  { t: "Technical data sheets", d: "TDS for every product in the automotive range.", onRequest: true },
  { t: "Safety data sheets", d: "SDS in the languages your market requires.", onRequest: true },
  { t: "Lab reports", d: "TÜV SÜD and SGS test documentation.", onRequest: true },
  { t: "Warranty terms", d: "What the coating is warranted against, and for how long.", onRequest: true },
];

export default function ResourcesPage() {
  return (
    <>
      <PageHero
        title="Resources"
        subhead="Documentation behind the claims"
        lede="Application guidance, brand artwork and the technical paperwork for the AUTOTRIZ automotive range."
      />

      <Band tone="white">
        <div className="shell">
          <Heading accent="library" rule>
            The
          </Heading>
          <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {assets.map((a, i) => (
              <Reveal
                as="li"
                key={a.t}
                delay={i % 4}
                className="group border border-border p-8 text-center transition-colors hover:border-primary"
              >
                <h2 className="display text-base">{a.t}</h2>
                <p className="mt-4 text-sm leading-relaxed text-foreground/75">{a.d}</p>
                <p className="label mt-6 text-muted-foreground">
                  {a.onRequest ? "On request" : "Download"}
                </p>
              </Reveal>
            ))}
          </ul>

          <div className="mt-14 text-center">
            <p className="prose-center text-foreground/75">
              Data sheets and lab reports are issued by the technical desk. Tell
              us which products you are working with and we will send the current
              revisions.
            </p>
            <div className="mt-8">
              <Button href="/contact">Request documentation</Button>
            </div>
          </div>
        </div>
      </Band>

      <Newsletter />
    </>
  );
}
