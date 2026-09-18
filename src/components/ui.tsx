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
   One button for the whole site: a link when it is given an `href`, a
   real <button> otherwise, so a call to action and a form submit are
   not two different pieces of code that drift apart.

   Hover is a colour change and nothing else. It used to fill by
   sliding a panel up behind the label, which meant the label and the
   background were briefly disagreeing about which state they were in —
   and depending on the variant that left dark text on dark, or light
   on light, or the accent washed out on white. A background and a
   colour moving together over the same 200ms cannot land in any of
   those states.
   ------------------------------------------------------------------ */

export type ButtonVariant = "primary" | "solid" | "outline" | "outline-light";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  /** Accent, going to ink. The usual call to action. */
  primary: "bg-primary text-primary-foreground hover:bg-foreground hover:text-background",
  /** Ink, going to accent. Carries the weight where the accent is
   *  already doing something else on the page — add to cart, checkout. */
  solid: "bg-foreground text-background hover:bg-primary hover:text-primary-foreground",
  /** Quiet on a pale band until it is pointed at. */
  outline:
    "border-2 border-foreground text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground",
  /** The same, for a dark band, where a full-strength border shouts. */
  "outline-light":
    "border-2 border-foreground/40 text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "px-4 py-2.5",
  md: "px-8 py-4",
  lg: "px-10 py-5",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
} = {}) {
  return cn(
    "label inline-flex items-center justify-center gap-3 rounded-sm transition-colors duration-200",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    SIZES[size],
    VARIANTS[variant],
    className,
  );
}

type CommonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** The trailing arrow. On by default for a link, off for an action. */
  arrow?: boolean;
  className?: string;
  children: ReactNode;
};

export function Button({
  variant = "primary",
  size = "md",
  arrow,
  className,
  children,
  ...props
}: CommonProps &
  (
    | ({ href: ComponentProps<typeof Link>["href"] } & Omit<ComponentProps<typeof Link>, "href">)
    | ({ href?: undefined } & ComponentProps<"button">)
  )) {
  const body = (
    <>
      {children}
      {arrow ?? "href" in props ? (
        <span aria-hidden className="text-[1.1em] leading-none">
          →
        </span>
      ) : null}
    </>
  );

  const classes = buttonClass({ variant, size, className });

  if ("href" in props && props.href !== undefined) {
    return (
      <Link {...(props as ComponentProps<typeof Link>)} className={classes}>
        {body}
      </Link>
    );
  }

  const { type = "button", ...rest } = props as ComponentProps<"button">;
  return (
    <button {...rest} type={type} className={classes}>
      {body}
    </button>
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
    /* Left-aligned. A three-line paragraph centred under a centred icon
       under a centred heading gives the eye a different starting point
       on every line, and six of them in a grid read as a template
       rather than as something written. */
    <div
      className={cn(
        "group border border-foreground/15 bg-card p-8 transition-colors duration-300",
        "hover:border-primary hover:bg-foreground/[0.04]",
        className,
      )}
    >
      <div className="grid size-12 place-items-center border border-primary/30 p-2.5 text-primary transition-colors duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <h3 className="display mt-6 text-base text-foreground">{title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-foreground/70">{children}</p>
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
      <p className="display text-[clamp(2.25rem,4.5vw,3.25rem)] text-primary tabular-nums">
        {value}
      </p>
      {/* A short rule under the figure. Four numbers in a row with
          nothing between them and their labels read as one drifting
          block; this gives each of them a foot to stand on. */}
      <span aria-hidden className="mx-auto mt-4 block h-0.5 w-8 bg-primary/40" />
      <p className="label mt-4 text-foreground/70">{label}</p>
    </div>
  );
}
