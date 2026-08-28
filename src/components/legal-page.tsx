import { PageHero } from "@/components/page-hero";
import { Band } from "@/components/ui";
import type { LegalDoc } from "@/lib/legal";

export function LegalPage({ doc }: { doc: LegalDoc }) {
  return (
    <>
      <PageHero title={doc.title} subhead={`Effective ${doc.effective}`} />

      <Band tone="white">
        <div className="shell">
          <div className="mx-auto max-w-3xl">
            {doc.blocks.map(([kind, text], i) => {
              if (kind === "h2") {
                return (
                  <h2 key={i} className="display mt-12 text-lg first:mt-0">
                    {text}
                  </h2>
                );
              }
              if (kind === "li") {
                return (
                  <p key={i} className="mt-3 flex gap-4 text-foreground/75">
                    <span aria-hidden className="mt-3 h-1 w-3 shrink-0 bg-primary" />
                    <span>{text}</span>
                  </p>
                );
              }
              return (
                <p key={i} className="mt-5 leading-relaxed text-foreground/75">
                  {text}
                </p>
              );
            })}
          </div>
        </div>
      </Band>
    </>
  );
}
