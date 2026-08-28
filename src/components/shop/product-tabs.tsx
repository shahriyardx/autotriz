"use client";

import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/catalogue";
import { cn } from "@/lib/cn";
import { Markdown } from "@/components/markdown";

const application = [
  "Wash and decontaminate. Iron fallout, tar and old protection all have to come off first.",
  "Correct the paint if it needs it — a coating locks in whatever is underneath.",
  "Panel wipe and dry completely. The surface must be bare before the coating touches it.",
  "Apply one section at a time in a crosshatch, then level within the flash window.",
  "Keep the panel dry for 24 hours while the matrix cures.",
];

export function ProductTabs({ product }: { product: Product }) {
  const tabs = [
    { id: "description", label: "Description" },
    { id: "specification", label: "Specification" },
    { id: "application", label: "How to use" },
    { id: "documents", label: "Documents" },
  ] as const;

  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("description");

  return (
    <div className="border-t border-border">
      <div role="tablist" className="flex flex-wrap gap-x-8 gap-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            aria-selected={active === tab.id}
            onClick={() => setActive(tab.id)}
            className={cn(
              "label relative -mt-px border-t-2 py-5 transition-colors",
              active === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="max-w-3xl py-8">
        {active === "description" ? (
          <div className="space-y-5">
            <Markdown>{product.description}</Markdown>
            {product.features.length ? (
              <ul className="space-y-2.5">
                {product.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-foreground/75">
                    <span aria-hidden className="mt-2.5 h-1 w-3 shrink-0 bg-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        {active === "specification" ? (
          <dl>
            {[
              ["Article number", product.sku],
              ["Category", product.category.name],
              ["Intended surface", product.surface],
              ["Pack size", product.size ?? "—"],
              ...product.attributes
                .filter((a) => a.visible)
                .map((a): [string, string] => [a.name, a.values.join(", ")]),
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-baseline justify-between gap-6 border-b border-border py-3.5"
              >
                <dt className="label text-muted-foreground">{k}</dt>
                <dd className="text-right text-sm text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {active === "application" ? (
          <ol className="space-y-4">
            {application.map((step, i) => (
              <li key={step} className="flex gap-5">
                <span className="display shrink-0 text-lg text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="pt-1 leading-relaxed text-foreground/75">{step}</span>
              </li>
            ))}
          </ol>
        ) : null}

        {active === "documents" ? (
          <div className="space-y-5">
            <p className="leading-relaxed text-foreground/75">
              Technical and safety data sheets are issued by the technical desk
              against the current revision. Tell us which products you are
              working with and we will send them over.
            </p>
            <Link
              href="/contact"
              className="label inline-block border-b-2 border-primary pb-1 text-foreground"
            >
              Request documentation →
            </Link>
          </div>
        ) : null}
      </div>
    </div>
  );
}
