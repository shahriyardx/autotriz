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
    description: "The banner, the science, the four pillars and the company sections.",
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
        title: "People behind the innovation",
        fields: [
          { key: "people.heading", type: "text", label: "Heading" },
          { key: "people.accent", type: "text", label: "Heading accent (yellow)" },
          { key: "people.body", type: "markdown", label: "Body copy" },
          { key: "people.image", type: "image", label: "Photograph" },
          {
            key: "people.centres",
            type: "list",
            label: "R&D centres",
            itemLabel: "country",
            max: 12,
            fields: [{ key: "name", type: "text", label: "Country" }],
          },
        ],
      },
      {
        title: "Polysilazane",
        fields: [
          { key: "polysilazane.heading", type: "text", label: "Heading" },
          { key: "polysilazane.accent", type: "text", label: "Heading accent (yellow)" },
          { key: "polysilazane.subhead", type: "text", label: "Standfirst" },
          { key: "polysilazane.body", type: "markdown", label: "Body copy" },
          { key: "polysilazane.image", type: "image", label: "Photograph" },
          {
            key: "polysilazane.resins",
            type: "list",
            label: "Resin types",
            itemLabel: "resin",
            max: 4,
            fields: [
              { key: "code", type: "text", label: "Short code" },
              { key: "name", type: "text", label: "Name" },
              { key: "body", type: "textarea", label: "Description" },
            ],
          },
        ],
      },
      {
        title: "What sets us apart",
        description: "Four claims, each with its own icon.",
        fields: [
          { key: "pillars.heading", type: "text", label: "Heading" },
          { key: "pillars.accent", type: "text", label: "Heading accent (yellow)" },
          {
            key: "pillars.items",
            type: "list",
            label: "Claims",
            itemLabel: "claim",
            max: 6,
            fields: [
              { key: "icon", type: "image", label: "Icon" },
              { key: "title", type: "text", label: "Title" },
              { key: "body", type: "textarea", label: "Description" },
            ],
          },
        ],
      },
      {
        title: "The company",
        fields: [
          { key: "company.heading", type: "text", label: "Heading" },
          { key: "company.accent", type: "text", label: "Heading accent (yellow)" },
          {
            key: "company.items",
            type: "list",
            label: "Sections",
            itemLabel: "section",
            max: 6,
            fields: [
              { key: "title", type: "text", label: "Title" },
              { key: "accent", type: "text", label: "Title accent (yellow)" },
              { key: "body", type: "markdown", label: "Body copy" },
              { key: "image", type: "image", label: "Photograph" },
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
          { key: "certs.note", type: "text", label: "Closing note" },
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
      title: "Innovation is the essence of",
      accent: "our business",
      subhead: "Nano ceramic coatings and specialty chemicals",
      lede: "AUTOTRIZ is a global leading producer of advanced high-quality and high-purity nano ceramic coatings and specialized chemicals.",
      image: "/about/hero-beads.webp",
    },
    people: {
      heading: "People behind the",
      accent: "innovation",
      body: "We collaborate with six R&D centres for technology support, and are committed to solving global challenges through scientific partnerships with leading universities.\n\nWe leverage our team of chemical engineers and materials scientists in developing the best solution for every application. The futuristic nano ceramic coatings we have developed perform better than the market alternatives because we do not merely improve a surface's properties — we optimise them for the long term.",
      centres: [
        { name: "Germany" },
        { name: "Japan" },
        { name: "South Korea" },
        { name: "Taiwan" },
        { name: "France" },
        { name: "United States" },
      ],
      image: "/about/people-lab.webp",
    },
    polysilazane: {
      heading: "Polysilazane",
      accent: "makes the difference",
      subhead: "The binder is what separates a coating from a wax",
      body: "Binders in our nano-ceramic protective coatings make such a difference. Rely on top performance from our organic polysilazanes, and our inorganic polysilazanes — better known as 3D Matrix technology.\n\nPolysilazanes are polymers of silicon, nitrogen, hydrogen and, in certain cases, carbon. They are either inorganic (perhydropolysilazanes) or organic (organopolysilazanes and polycarbosilazanes) in nature.",
      resins: [
        {
          code: "OPSZ",
          name: "Organic polysilazane resins",
          body: "Hydrophobic coatings. Water beads, lifts the dirt with it, and leaves the panel as it rolls off.",
        },
        {
          code: "PHPS",
          name: "Perhydropolysilazane resins",
          body: "Hydrophilic coatings. A glass-like film for surfaces where sheeting matters more than beading.",
        },
      ],
      image: "/about/polysilazane.webp",
    },
    pillars: {
      heading: "What sets us",
      accent: "apart",
      items: [
        {
          icon: "/about/pillar-1.png",
          title: "Cutting-edge technology",
          body: "Up-to-date technology, facilities and technical know-how, built on international standards.",
        },
        {
          icon: "/about/pillar-2.png",
          title: "Durable, high-quality materials",
          body: "Global reach and connections for sourcing the rarest and finest materials.",
        },
        {
          icon: "/about/pillar-3.png",
          title: "Bespoke service",
          body: "Thorough assistance and clear answers for every kind of support request.",
        },
        {
          icon: "/about/pillar-4.png",
          title: "24/7 customer service",
          body: "Support by call, email and live chat, across time zones and regions.",
        },
      ],
    },
    company: {
      heading: "The",
      accent: "company",
      items: [
        {
          title: "World's leader in",
          accent: "nano technology",
          image: "/about/nano-technology.webp",
          body: "AUTOTRIZ is a leading name in nano ceramic surface protection, with a series of ceramic coating and paint protection film products, each formulated for a specific surface. Our formulas are designed for paint, vinyl, fabric, glass, leather and more. AUTOTRIZ coatings bond at a nano-molecular level, filling every pore and creating a permanent, protective surface. Our VERTEK films were developed with the same patented polysilazane technology.",
        },
        {
          title: "Safety &",
          accent: "regulations",
          image: "/about/safety-regulations.webp",
          body: "We are committed to supplying products and services of the highest quality and to meeting our customers' requirements. The cornerstone is an effective quality management system that meets ISO 9001:2015, complies with applicable statutory and regulatory requirements, and involves every level of the organisation.",
        },
        {
          title: "State-of-art",
          accent: "production facilities",
          image: "/about/production-line.webp",
          body: "We manufacture our own products and are organised to meet growing demand. With extensive raw materials, technical know-how and advanced technology from around the globe, our formulas are developed and tested in-house — which is also why we can supply OEM customers and customise formulations for other brands.\n\nWe work alongside scientists and detailing professionals, so every product is formulated, developed, tested and manufactured in our own facilities.",
        },
        {
          title: "Network &",
          accent: "business",
          image: "/about/network-business.webp",
          body: "We offer top-quality products, outstanding service and technical support to build long-term relationships with the workshops, detailers and car owners we serve, backed by a dedicated customer service desk and our social channels.",
        },
      ],
    },
    certs: {
      heading: "Independently",
      accent: "tested",
      subhead: "Verified by people who are not us",
      note: "AUTOTRIZ® is manufactured by Triz International Sdn. Bhd.",
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
