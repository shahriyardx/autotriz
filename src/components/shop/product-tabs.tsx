"use client";

import { useState } from "react";
import type { Product } from "@/lib/catalogue";
import { cn } from "@/lib/cn";
import { Markdown } from "@/components/markdown";

export function ProductTabs({ product }: { product: Product }) {
  const tabs = [
    { id: "description", label: "Description" },
    { id: "specification", label: "Specification" },
  ] as const;

  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("description");

  /* A blank line in the admin's feature box would otherwise reach the
     page as a bullet with nothing beside it. */
  const features = product.features.map((f) => f.trim()).filter(Boolean);

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
          <div className="space-y-8">
            <Markdown>{product.description}</Markdown>

            {/* Headed and ruled off. Unlabelled, a feature list sitting
                under a description that ends in its own bullets read as
                one long list with no telling where one stopped. */}
            {features.length ? (
              <div className="border-t border-border pt-7">
                <h3 className="label text-muted-foreground">At a glance</h3>
                <ul className="mt-5 space-y-2.5">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-foreground/75">
                      <span aria-hidden className="mt-2.5 h-1 w-3 shrink-0 bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
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
      </div>
    </div>
  );
}
