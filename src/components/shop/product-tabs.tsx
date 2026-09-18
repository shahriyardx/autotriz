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
          <Markdown>{product.description}</Markdown>
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
