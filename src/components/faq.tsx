import { Markdown } from "@/components/markdown";
import { Reveal } from "@/components/reveal";
import { Heading } from "@/components/ui";
import { cn } from "@/lib/cn";

/* ==================================================================
   FREQUENTLY ASKED QUESTIONS

   Built on `<details>`, so it opens and closes with no JavaScript at
   all: it works before the page hydrates, a screen reader announces
   it as the disclosure it is, and the browser's own find-in-page can
   open an answer to reach the text inside it.
   ================================================================== */

export type FaqItem = { q: string; a: string };

export function Faq({
  items,
  heading = "Frequently asked",
  accent = "questions",
  subhead,
  className,
}: {
  items: FaqItem[];
  heading?: string;
  accent?: string;
  subhead?: string;
  className?: string;
}) {
  if (!items.length) return null;

  return (
    <div className={cn("shell", className)}>
      <Heading accent={accent} rule subhead={subhead}>
        {heading}
      </Heading>

      <div className="mx-auto mt-14 max-w-3xl divide-y divide-border border-y border-border">
        {items.map((item, i) => (
          <Reveal key={item.q} delay={Math.min(i, 3)}>
            <details className="group">
              <summary
                className={cn(
                  "flex cursor-pointer list-none items-start justify-between gap-6 py-6",
                  "display-tight text-base text-foreground transition-colors hover:text-primary",
                  // Safari shows its own triangle without this.
                  "[&::-webkit-details-marker]:hidden",
                )}
              >
                {item.q}

                {/* A plus that becomes a minus, drawn rather than
                    imported: two bars, one of which folds away. */}
                <span
                  aria-hidden
                  className="relative mt-1.5 grid size-4 shrink-0 place-items-center"
                >
                  <span className="absolute h-0.5 w-4 bg-primary" />
                  <span className="absolute h-4 w-0.5 bg-primary transition-transform duration-300 group-open:scale-y-0" />
                </span>
              </summary>

              <Markdown className="pb-7 pr-10 text-sm">{item.a}</Markdown>
            </details>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
