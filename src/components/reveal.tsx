"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode } from "react";

const variants: Variants = {
  hidden: { opacity: 0, y: 24 },
  /* A negative index means "someone asked for less motion": the element
     still appears, it just arrives at once. */
  shown: (i: number) => ({
    opacity: 1,
    y: 0,
    transition:
      i < 0
        ? { duration: 0 }
        : { duration: 0.85, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] },
  }),
};

/** Fades and lifts its children the first time they scroll into view. */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "li" | "section" | "article";
}) {
  const Tag = motion[as];
  const still = useReducedMotion();

  return (
    <Tag
      className={className}
      custom={still ? -1 : delay}
      variants={variants}
      // Always "hidden" to begin with: the server renders that too, and a
      // different first client render would be a hydration mismatch.
      initial="hidden"
      whileInView="shown"
      viewport={{ once: true, margin: "-80px" }}
    >
      {children}
    </Tag>
  );
}

/** Wipes a horizontal rule open from left to right — used to draw the
 *  datasheet hairlines in as you scroll. */
export function RuleReveal({ className }: { className?: string }) {
  const still = useReducedMotion();

  return (
    <motion.div
      className={className ?? "h-px w-full bg-border origin-left"}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true }}
      transition={still ? { duration: 0 } : { duration: 1.1, ease: [0.83, 0, 0.17, 1] }}
    />
  );
}
