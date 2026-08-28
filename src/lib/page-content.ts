/* ==================================================================
   Editable page content.

   Each page declares the fields that are worth editing — headings,
   copy, images, small repeating lists. Layout stays in the code; only
   the words and pictures come from the database.

   No database import here, so the admin form and the storefront read
   from exactly the same definitions.
   ================================================================== */

export type FieldType = "text" | "textarea" | "markdown" | "image" | "video" | "link";

export type Field =
  | {
      key: string;
      type: FieldType;
      label: string;
      help?: string;
      placeholder?: string;
    }
  | {
      key: string;
      type: "list";
      label: string;
      help?: string;
      /** Singular noun for the add button, e.g. "step". */
      itemLabel: string;
      max?: number;
      fields: Field[];
    };

export type Section = { title: string; description?: string; fields: Field[] };

export type PageDef = {
  key: string;
  name: string;
  /** Where it appears on the site, for the "View page" link. */
  path: string;
  description: string;
  sections: Section[];
};

/* ------------------------------------------------------------------
   The pages
   ------------------------------------------------------------------ */

export const PAGES: PageDef[] = [
  {
    key: "home",
    name: "Home",
    path: "/",
    description: "The hero, the introduction and the call to action.",
    sections: [
      {
        title: "Hero",
        description: "The first screen. Three heading lines, one of them yellow.",
        fields: [
          { key: "hero.line1", type: "text", label: "Heading line 1", placeholder: "Next-generation" },
          { key: "hero.line2", type: "text", label: "Heading line 2", placeholder: "ceramic" },
          { key: "hero.accent", type: "text", label: "Heading line 3 (yellow)", placeholder: "protection" },
          { key: "hero.lede", type: "textarea", label: "Supporting paragraph" },
          { key: "hero.primaryLabel", type: "text", label: "Main button label" },
          { key: "hero.primaryHref", type: "link", label: "Main button link" },
          { key: "hero.secondaryLabel", type: "text", label: "Second button label" },
          { key: "hero.secondaryHref", type: "link", label: "Second button link" },
          {
            key: "hero.video",
            type: "video",
            label: "Background video",
            help: "Plays silently on a loop. Leave empty to show the photograph instead.",
          },
          {
            key: "hero.image",
            type: "image",
            label: "Background photograph",
            help: "Shown while the video loads, and on its own if there is no video.",
          },
          { key: "hero.imageAlt", type: "text", label: "Photograph description", help: "Read aloud by screen readers." },
        ],
      },
      {
        title: "Introduction",
        fields: [
          { key: "intro.heading", type: "text", label: "Heading" },
          { key: "intro.accent", type: "text", label: "Heading accent (yellow)" },
          { key: "intro.subhead", type: "text", label: "Standfirst" },
          { key: "intro.body", type: "markdown", label: "Body copy" },
        ],
      },
      {
        title: "Range showcase",
        description: "Three cards linking to the ranges. Each is matched to a category by its slug.",
        fields: [
          {
            key: "showcase",
            type: "list",
            label: "Cards",
            itemLabel: "card",
            max: 4,
            fields: [
              { key: "categorySlug", type: "text", label: "Category slug", help: "For example: coating" },
              { key: "image", type: "image", label: "Photograph" },
              { key: "body", type: "textarea", label: "Description" },
            ],
          },
        ],
      },
      {
        title: "Numbers",
        fields: [
          { key: "stats.heading", type: "text", label: "Heading" },
          {
            key: "stats.items",
            type: "list",
            label: "Figures",
            itemLabel: "figure",
            max: 6,
            fields: [
              { key: "value", type: "text", label: "Figure" },
              { key: "label", type: "text", label: "Label" },
            ],
          },
        ],
      },
      {
        title: "Why AUTOTRIZ",
        fields: [
          { key: "benefits.heading", type: "text", label: "Heading" },
          { key: "benefits.accent", type: "text", label: "Heading accent (yellow)" },
          {
            key: "benefits.items",
            type: "list",
            label: "Claims",
            itemLabel: "claim",
            max: 9,
            fields: [
              { key: "name", type: "text", label: "Title" },
              { key: "body", type: "textarea", label: "Description" },
            ],
          },
        ],
      },
      {
        title: "Certification",
        fields: [
          { key: "certs.heading", type: "text", label: "Heading" },
          { key: "certs.accent", type: "text", label: "Heading accent (yellow)" },
          { key: "certs.subhead", type: "text", label: "Standfirst" },
          {
            key: "certs.items",
            type: "list",
            label: "Certificates",
            itemLabel: "certificate",
            max: 8,
            fields: [
              { key: "name", type: "text", label: "Name" },
              { key: "note", type: "text", label: "Note" },
            ],
          },
          { key: "certs.ctaLabel", type: "text", label: "Button label" },
          { key: "certs.ctaHref", type: "link", label: "Button link" },
        ],
      },
      {
        title: "Services call to action",
        fields: [
          { key: "services.heading", type: "text", label: "Heading" },
          { key: "services.accent", type: "text", label: "Heading accent (yellow)" },
          { key: "services.subhead", type: "text", label: "Standfirst" },
          { key: "services.ctaLabel", type: "text", label: "Button label" },
          { key: "services.ctaHref", type: "link", label: "Button link" },
        ],
      },
    ],
  },
  {
    key: "about",
    name: "About",
    path: "/about",
    description: "The banner and the story sections.",
    sections: [
      {
        title: "Banner",
        fields: [
          { key: "hero.title", type: "text", label: "Title" },
          { key: "hero.accent", type: "text", label: "Title accent (yellow)" },
          { key: "hero.subhead", type: "text", label: "Standfirst" },
          { key: "hero.lede", type: "textarea", label: "Supporting paragraph" },
          { key: "hero.image", type: "image", label: "Background photograph" },
        ],
      },
      {
        title: "The chemistry",
        fields: [
          { key: "chemistry.heading", type: "text", label: "Heading" },
          { key: "chemistry.accent", type: "text", label: "Heading accent (yellow)" },
          { key: "chemistry.subhead", type: "text", label: "Standfirst" },
          { key: "chemistry.body", type: "markdown", label: "Body copy" },
        ],
      },
      {
        title: "Manufacturing",
        fields: [
          { key: "manufacturing.heading", type: "text", label: "Heading" },
          { key: "manufacturing.accent", type: "text", label: "Heading accent (yellow)" },
          { key: "manufacturing.body", type: "markdown", label: "Body copy" },
          { key: "manufacturing.image", type: "image", label: "Photograph" },
        ],
      },
    ],
  },
  {
    key: "services",
    name: "Services",
    path: "/services",
    description: "The services banner and the reasons to choose us.",
    sections: [
      {
        title: "Banner",
        fields: [
          { key: "hero.title", type: "text", label: "Title" },
          { key: "hero.accent", type: "text", label: "Title accent (yellow)" },
          { key: "hero.subhead", type: "text", label: "Standfirst" },
          { key: "hero.lede", type: "textarea", label: "Supporting paragraph" },
          { key: "hero.image", type: "image", label: "Background photograph" },
        ],
      },
      {
        title: "Why choose us",
        fields: [
          { key: "reasons.heading", type: "text", label: "Heading" },
          { key: "reasons.accent", type: "text", label: "Heading accent (yellow)" },
          {
            key: "reasons.items",
            type: "list",
            label: "Reasons",
            itemLabel: "reason",
            max: 8,
            fields: [
              { key: "t", type: "text", label: "Title" },
              { key: "d", type: "textarea", label: "Description" },
            ],
          },
        ],
      },
    ],
  },
  {
    key: "shop",
    name: "Shop",
    path: "/shop",
    description: "The banner above the product grid.",
    sections: [
      {
        title: "Banner",
        fields: [
          { key: "hero.title", type: "text", label: "Title" },
          { key: "hero.accent", type: "text", label: "Title accent (yellow)" },
          { key: "hero.subhead", type: "text", label: "Standfirst" },
          { key: "hero.lede", type: "textarea", label: "Supporting paragraph" },
        ],
      },
    ],
  },
  {
    key: "contact",
    name: "Contact",
    path: "/contact",
    description: "The banner and the wording around the form.",
    sections: [
      {
        title: "Banner",
        fields: [
          { key: "hero.title", type: "text", label: "Title" },
          { key: "hero.accent", type: "text", label: "Title accent (yellow)" },
          { key: "hero.subhead", type: "text", label: "Standfirst" },
          { key: "hero.lede", type: "textarea", label: "Supporting paragraph" },
        ],
      },
      {
        title: "Around the form",
        fields: [
          { key: "form.heading", type: "text", label: "Form heading" },
          { key: "form.directHeading", type: "text", label: "Direct-contact heading" },
          { key: "form.brandNote", type: "markdown", label: "Note under the email address" },
        ],
      },
    ],
  },
];

export const PAGE_KEYS = PAGES.map((p) => p.key);

export const findPage = (key: string) => PAGES.find((p) => p.key === key);

/* ------------------------------------------------------------------
   Defaults — the copy the site shipped with. Anything left empty in
   the admin falls back to these, so a page is never blank.
   ------------------------------------------------------------------ */

export const PAGE_DEFAULTS: Record<string, Record<string, unknown>> = {
  home: {
    hero: {
      line1: "Next-generation",
      line2: "ceramic",
      accent: "protection",
      lede: "AUTOTRIZ manufactures the patented polysilazane chemistry behind a cured 3D matrix nano structure above 9H — for paint, glass, wheels and interiors.",
      primaryLabel: "Shop the range",
      primaryHref: "/automotive-ceramic-coating",
      secondaryLabel: "Why AUTOTRIZ",
      secondaryHref: "/about",
      video: "/video/hero.mp4",
      image: "/video/hero-poster.webp",
      imageAlt: "A supercar being washed down in a detailing bay",
    },
    intro: {
      heading: "Ultimate",
      accent: "Protection",
      subhead: "One coating, every surface on the car",
      body: "AUTOTRIZ is a global producer of high quality, durable nano ceramic coatings and specialty chemicals, with R&D facilities in Germany. Innovation is the essence of our business — we develop, manufacture and distribute coatings that add real value to a surface rather than sitting on top of it.",
    },
    showcase: [
      {
        categorySlug: "coating",
        image: "/photo/hero-car.webp",
        body: "Unmatched protection is the reason AUTOTRIZ is trusted by owners and collectors of classic and exotic automobiles around the world.",
      },
      {
        categorySlug: "polish",
        image: "/photo/coating-application.webp",
        body: "A cut-to-finish system with no fillers and no silicone, so the paint you correct is exactly the paint the coating locks in.",
      },
      {
        categorySlug: "consumer",
        image: "/photo/hero-wash.webp",
        body: "The same chemistry, reformulated with a longer flash window so a careful owner can lay it down at home.",
      },
    ],
    stats: {
      heading: "We take pride in our numbers",
      items: [
        { value: "20+", label: "Years in surface chemistry" },
        { value: "500+", label: "Authorised detailers" },
        { value: "500,000+", label: "Coatings sold" },
        { value: "60+", label: "Countries served" },
      ],
    },
    benefits: {
      heading: "Why",
      accent: "AUTOTRIZ?",
      items: [
        { name: "Scratch Protection", body: "A cured matrix rated above 9H resists the swirls that wash mitts and automatic tunnels leave behind." },
        { name: "Chemical Resistance", body: "Bird lime, tree sap, road salt and industrial fallout sit on the coating instead of etching the clear coat." },
        { name: "UV Protection", body: "Blocks the ultraviolet load that oxidises pigment and fades a finish long before the panel ever rusts." },
        { name: "Anti-Fouling", body: "A low-energy surface gives dirt, brake dust and organic growth almost nothing to hold on to." },
        { name: "Stain Resistance", body: "Water spotting and mineral deposits release under a normal wash rather than needing correction." },
        { name: "Corrosion Protection", body: "A continuous, non-porous barrier keeps moisture and chloride away from the substrate underneath." },
      ],
    },
    certs: {
      heading: "Technology",
      accent: "Testing",
      subhead: "Verified by people who are not us",
      items: [
        { name: "TÜV SÜD", note: "Independently tested" },
        { name: "SGS", note: "Inspected and certified" },
        { name: "ISO 9001:2015", note: "Quality management" },
        { name: "REACH", note: "SVHC-free compliance" },
      ],
      ctaLabel: "Shop the range",
      ctaHref: "/automotive-ceramic-coating",
    },
    services: {
      heading: "Professional application",
      accent: "in Dhaka",
      subhead: "Film, tint, correction and washing — applied by AUTOTRIZ-trained hands",
      ctaLabel: "Book a service",
      ctaHref: "/contact?topic=booking",
    },
  },
  about: {
    hero: {
      title: "About",
      accent: "AUTOTRIZ",
      subhead: "Innovation is the essence of our business",
      lede: "We formulate, test and fill our own coatings. That is why we can change one for a customer who needs it changed.",
      image: "/photo/coating-application.webp",
    },
    chemistry: {
      heading: "The chemistry",
      accent: "Polysilazane",
      subhead: "Not another silica suspension",
      body: "Most coatings on the market are SiO₂ suspensions. AUTOTRIZ is built on polysilazane resins — the binder family used for industrial anti-corrosion and high-temperature protection.",
    },
    manufacturing: {
      heading: "Manufactured",
      accent: "in house",
      body: "An automated line running up to 2,000 units an hour, under an ISO 9001:2015 quality system. Our chemists work with research partners and universities across six countries — surface science moves quickly, and a single lab does not keep up with it.",
      image: "/photo/hero-wash.webp",
    },
  },
  services: {
    hero: {
      title: "Our",
      accent: "Services",
      subhead: "Protection, applied properly",
      lede: "Our paint protection film is trusted by car enthusiasts and professionals to deliver superior protection, unmatched clarity and a long-lasting finish for every vehicle we care for.",
      image: "/photo/coating-application.webp",
    },
    reasons: {
      heading: "Why choose",
      accent: "us?",
      items: [
        { t: "Premium materials", d: "Only AUTOTRIZ chemistry and film go on your car — the same products we sell to professionals." },
        { t: "Trained installers", d: "Every technician is trained and certified on the products they apply." },
        { t: "Measured, not guessed", d: "Paint depth is read before any correction. Nothing is over-polished." },
        { t: "Written warranty", d: "Film and coating work is backed by a warranty you can read before you book." },
      ],
    },
  },
  shop: {
    hero: {
      title: "Shop the",
      accent: "range",
      subhead: "Every AUTOTRIZ product for automotive",
      lede: "Coatings, compounds, preparation chemistry and after care — the full professional system plus the DIY range.",
    },
  },
  contact: {
    hero: {
      title: "Contact",
      accent: "us",
      subhead: "One studio, in Dhaka",
      lede: "Orders, service bookings, technical questions and documentation requests all come to the same desk.",
    },
    form: {
      heading: "Send a message",
      directHeading: "Direct",
      brandNote:
        "AUTOTRIZ® is manufactured by Triz International Sdn. Bhd. This site is the official AUTOTRIZ presence for Bangladesh.",
    },
  },
};

/* ------------------------------------------------------------------
   Reading
   ------------------------------------------------------------------ */

type Bag = Record<string, unknown>;

const isPlainObject = (value: unknown): value is Bag =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/** Stored values win, but only where they actually hold something —
 *  an empty field falls back to the shipped copy. */
export function mergeContent(defaults: Bag, stored: Bag | null | undefined): Bag {
  if (!isPlainObject(stored)) return defaults;
  const out: Bag = { ...defaults };

  for (const [key, value] of Object.entries(stored)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (Array.isArray(value)) {
      if (value.length) out[key] = value;
      continue;
    }
    if (isPlainObject(value)) {
      out[key] = mergeContent(isPlainObject(defaults[key]) ? defaults[key] : {}, value);
      continue;
    }
    out[key] = value;
  }

  return out;
}

/** Reads `a.b.c` out of a content bag. */
export function pick<T = string>(content: Bag, path: string, fallback?: T): T {
  const value = path
    .split(".")
    .reduce<unknown>((acc, part) => (isPlainObject(acc) ? acc[part] : undefined), content);
  return (value === undefined || value === null ? fallback : value) as T;
}
