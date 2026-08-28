/* Thin line icons drawn to match the primary outline set on the current
   site. All of them inherit colour from the parent, so they work on a
   charcoal band without a second copy. */

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 48 48",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.4,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className: "h-full w-full",
};

export function ScratchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className ?? base.className} aria-hidden>
      <path d="M24 5l15 6v11c0 10-6.4 17.6-15 21-8.6-3.4-15-11-15-21V11z" />
      <path d="M18 22l6 6 9-10" />
    </svg>
  );
}

export function ChemicalIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className ?? base.className} aria-hidden>
      <path d="M20 6v13L9 36a4 4 0 003.4 6h23.2A4 4 0 0039 36L28 19V6" />
      <path d="M17 6h14" />
      <path d="M14.5 28h19" />
    </svg>
  );
}

export function UvIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className ?? base.className} aria-hidden>
      <circle cx="24" cy="24" r="8" />
      <path d="M24 4v5M24 39v5M4 24h5M39 24h5M10 10l3.5 3.5M34.5 34.5L38 38M38 10l-3.5 3.5M13.5 34.5L10 38" />
    </svg>
  );
}

export function FoulingIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className ?? base.className} aria-hidden>
      <path d="M24 6c6 8 10 13.2 10 18.5A10 10 0 0114 24.5C14 19.2 18 14 24 6z" />
      <path d="M6 40c4-3 7-3 11 0s7 3 11 0 7-3 10 0" />
    </svg>
  );
}

export function StainIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className ?? base.className} aria-hidden>
      <path d="M24 5c5.6 7.5 9 12.4 9 17.3A9 9 0 0115 22.3C15 17.4 18.4 12.5 24 5z" />
      <path d="M10 36h28M14 42h20" />
    </svg>
  );
}

export function CorrosionIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className ?? base.className} aria-hidden>
      <path d="M8 16l16-8 16 8v13c0 8-6.5 13.6-16 16-9.5-2.4-16-8-16-16z" />
      <path d="M24 17v10M24 32.5v.5" />
    </svg>
  );
}

export const benefitIcons = {
  "01": ScratchIcon,
  "02": ChemicalIcon,
  "03": UvIcon,
  "04": FoulingIcon,
  "05": StainIcon,
  "06": CorrosionIcon,
} as const;
