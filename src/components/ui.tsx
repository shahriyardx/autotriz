import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

/* --- Band ----------------------------------------------------------
   A full-width horizontal section. The page reads as an alternating
   stack of these: white, charcoal, white.                             */

export function Band({
  children,
  tone = "white",
  className,
  id,
}: {
  children: ReactNode;
  /** `white` and `mist` are light surfaces. `dark` flips the section to
   *  the dark palette — every token inside it follows. */
  tone?: "white" | "mist" | "dark";
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      className={cn(
        "band relative text-foreground",
        tone === "white" && "bg-background",
        tone === "mist" && "bg-muted",
        tone === "dark" && "dark bg-background text-foreground/75",
        className,
      )}
    >
      {children}
    </section>
  );
}

/* --- Section heading -----------------------------------------------
   Centred, uppercase, with one word carried in primary — the brand's
   signature. Pass `accent` and it is appended in primary.              */

export function Heading({
  children,
  accent,
  subhead,
  tone = "dark",
  rule = false,
  align = "center",
  size = "lg",
  as: Tag = "h2",
  className,
}: {
  children: ReactNode;
  accent?: string;
  subhead?: string;
  /** `dark` = ink text for white bands, `light` = white text for charcoal bands. */
  tone?: "dark" | "light";
  rule?: boolean;
  align?: "center" | "left";
  size?: "sm" | "lg" | "xl";
  as?: "h1" | "h2" | "h3";
  className?: string;
}) {
  return (
    <div className={cn(align === "center" && "text-center", className)}>
      <Tag
        className={cn(
          "display",
          size === "sm" && "text-[clamp(1.375rem,2.4vw,1.875rem)]",
          size === "lg" && "text-[clamp(1.75rem,3.4vw,2.75rem)]",
          size === "xl" && "text-[clamp(2.25rem,5vw,4rem)]",
          tone === "light" && "text-foreground",
        )}
      >
        {children}
        {accent ? (
          <>
            {" "}
            <span className="accent">{accent}</span>
          </>
        ) : null}
      </Tag>

      {subhead ? <p className="subhead mt-4">{subhead}</p> : null}

      {rule ? (
        <span
          aria-hidden
          className={cn("heading-rule mt-7", align === "left" && "mx-0")}
        />
      ) : null}
    </div>
  );
}

/* --- Button --------------------------------------------------------
   Solid primary is the primary call to action, matching the utility
   bar. Outline variants exist for both band tones.                    */

type ButtonProps = {
  variant?: "primary" | "outline" | "outline-light";
  size?: "md" | "lg";
  className?: string;
  children: ReactNode;
} & ComponentProps<typeof Link>;

export function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <Link
      {...props}
      className={cn(
        /* A *named* group. `group-hover` matches any ancestor carrying
           `group`, so an unnamed one here meant a card that is itself a
           group slid the button's fill up whenever the card was hovered
           — on an outline button that left dark text on a dark fill,
           unreadable, without the pointer ever being near it. */
        "label group/btn relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-sm transition-colors duration-300",
        size === "md" && "px-8 py-4",
        size === "lg" && "px-10 py-5",
        variant === "primary" && "bg-primary text-primary-foreground",
        /* Outline buttons fill with the accent and keep their dark
           label, which is the solid button's own colour pairing. The
           label never changes on a light band, so there is no moment
           where the text and the background are fighting — and unlike
           accent-on-white, the result is actually readable. */
        variant === "outline" &&
          "border-2 border-foreground text-foreground hover:border-primary hover:bg-primary",
        variant === "outline-light" &&
          "border-2 border-foreground/40 text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground",
        className,
      )}
    >
      {/* Only the solid button fills: it starts on the accent, so the
          panel sliding up behind the label has somewhere to go. */}
      {variant === "primary" ? (
        <span
          aria-hidden
          className="absolute inset-0 -z-0 translate-y-full bg-foreground transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/btn:translate-y-0"
        />
      ) : null}
      {/* On the solid button the label waits for the fill. Its colour
          alone takes 150ms and the panel takes 400ms, so flipping it
          early turns the text the accent colour while the accent is
          still the background behind it. Nothing on the way out, where
          the colour it returns to is the safe one. */}
      <span
        className={cn(
          "relative transition-colors",
          /* `background` is the opposite of `foreground` in either
             palette, and the fill is `foreground` — so this is white on
             ink on a pale page and ink on white inside a dark band,
             without a second rule for the dark case. The accent was the
             wrong choice here: yellow on ink is dim next to the label
             it replaces. */
          variant === "primary" &&
            "group-hover/btn:text-background group-hover/btn:delay-300",
        )}
      >
        {children}
      </span>
      <span
        aria-hidden
        className={cn(
          "relative transition-[transform,color] duration-300 group-hover/btn:translate-x-1",
          /* `background` is the opposite of `foreground` in either
             palette, and the fill is `foreground` — so this is white on
             ink on a pale page and ink on white inside a dark band,
             without a second rule for the dark case. The accent was the
             wrong choice here: yellow on ink is dim next to the label
             it replaces. */
          variant === "primary" &&
            "group-hover/btn:text-background group-hover/btn:delay-300",
        )}
      >
        →
      </span>
    </Link>
  );
}

/* --- Feature card --------------------------------------------------
   The bordered card used for the six protection claims: a thin primary
   icon, a bold uppercase label, then supporting copy.                 */

export function FeatureCard({
  icon,
  title,
  children,
  className,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "group border border-foreground/15 bg-card p-8 text-center transition-colors duration-500 hover:border-primary",
        className,
      )}
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center text-primary">
        {icon}
      </div>
      <h3 className="display mt-6 text-lg text-foreground">{title}</h3>
      <p className="mt-4 text-sm leading-relaxed text-foreground/60">{children}</p>
    </div>
  );
}

/* --- Spec row ------------------------------------------------------ */

export function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-border py-3.5">
      <dt className="label text-muted-foreground">{k}</dt>
      <dd className="text-right text-sm text-foreground">{v}</dd>
    </div>
  );
}

/* --- Stat ----------------------------------------------------------- */

export function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="display text-[clamp(2rem,4vw,3rem)] text-primary">{value}</p>
      <p className="label mt-3 text-foreground/60">{label}</p>
    </div>
  );
}
