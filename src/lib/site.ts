// Single source of truth for navigation, contact details and the
// numbers we quote across the site.

/* Fixed facts about the site itself. Everything a shopkeeper might
   want to change — contact details, hours, social accounts — lives in
   the settings table instead; see `src/lib/shop-settings.ts`. */
export const site = {
  name: "AUTOTRIZ",
  registered: "AUTOTRIZ®",
  tagline: "Innovative Surface Creation",
  promise: "Next-generation ceramic protection",
  url: "https://www.auto-triz.com",
  email: "info@auto-triz.com",
  description:
    "AUTOTRIZ manufactures professional nano ceramic coatings for automotive paint, glass, wheels and interiors. Patented polysilazane chemistry, tested and certified by TÜV SÜD and SGS.",
};

// Headline figures. Kept here so a single edit updates every surface
// that quotes them.
export const stats = [
  { value: "20+", label: "Years in surface chemistry" },
  { value: "500+", label: "Authorised detailers" },
  { value: "500,000+", label: "Coatings sold" },
  { value: "60+", label: "Countries served" },
];

/* ------------------------------------------------------------------
   SERVICES — the Bangladesh studio. Paint protection film, tint,
   correction and wash, all applied with AUTOTRIZ chemistry.
   ------------------------------------------------------------------ */

export const serviceStats = [
  { value: "10 yrs", label: "Film warranty" },
  { value: "48 hrs", label: "Full-body turnaround" },
  { value: "99%", label: "UV rejection" },
  { value: "4,800+", label: "Cars protected" },
];

export type Service = {
  slug: string;
  name: string;
  short: string;
  lede: string;
  image: string;
  highlights: string[];
  body: string[];
  steps: { t: string; d: string }[];
};

export const services: Service[] = [
  {
    slug: "ppf-installation",
    name: "PPF Installation",
    short: "High-performance protection film that shields your car from scratches, chips and swirls.",
    lede: "AUTOTRIZ paint protection film is fitted by trained installers using computer-cut patterns and wrapped edges — so your factory finish stays sealed against stone chips, road grit and UV fade without a visible seam.",
    image: "/photo/hero-car.webp",
    highlights: ["Self-healing top coat", "Stain and UV resistant", "Rock chip protection"],
    body: [
      "Film is only as good as the hands that lay it. Every panel is decontaminated, corrected where needed and fitted from a plotter-cut pattern for that exact model, so edges wrap out of sight and nothing is trimmed on the paint.",
      "The film's top coat re-flows under warmth, so fine swirls and wash marks disappear on their own. Underneath it, the urethane absorbs the impact that would otherwise chip the clear coat.",
    ],
    steps: [
      { t: "Inspect and correct", d: "The paint is decontaminated and polished so nothing is locked in under the film." },
      { t: "Cut and fit", d: "Patterns are plotter-cut for the exact model, then laid with wrapped edges." },
      { t: "Cure and hand over", d: "The car rests while the film tacks fully. You leave with the care guide." },
    ],
  },
  {
    slug: "window-tint",
    name: "Window Tint",
    short: "Ceramic window film that rejects heat and UV without darkening your view.",
    lede: "Nano-ceramic window film blocks the infrared load that heats a cabin and the UV that fades an interior, while keeping the glass clear enough to drive at night.",
    image: "/photo/hero-wash.webp",
    highlights: ["Up to 99% UV rejection", "Infrared heat rejection", "No signal interference"],
    body: [
      "Ceramic film uses no metal, so phone, GPS and toll signals pass straight through. It is cut on the plotter to the glass pattern and shrunk to the curve, so there are no gaps at the edges and no bubbles later.",
      "Shades are chosen to sit within the legal limit for the glass they go on, and the film is warranted against fading, peeling and turning purple.",
    ],
    steps: [
      { t: "Choose the shade", d: "We show the film on the glass so you see the result before it goes on." },
      { t: "Cut and shrink", d: "Film is cut to the glass pattern and heat-shrunk to the curve." },
      { t: "Install and cure", d: "Fitted on the inside and left to dry out over the following days." },
    ],
  },
  {
    slug: "car-polish",
    name: "Car Polish",
    short: "Machine paint correction with AUTOTRIZ micro-abrasive compounds.",
    lede: "Swirls, holograms and light scratches are polished out of the clear coat — not filled — using the same German micro-abrasive compounds we sell to body shops.",
    image: "/photo/coating-application.webp",
    highlights: ["No fillers, no silicone", "Paint-depth measured", "Finished under inspection lighting"],
    body: [
      "Polishing has to be perfect. The paint is measured first so we know how much clear coat there is to work with, then cut, refined and finished in stages under lighting that shows every defect.",
      "Because the compounds contain no fillers, what you see at hand-over is the real surface. It is the right stage to coat or film straight after.",
    ],
    steps: [
      { t: "Wash and measure", d: "Decontaminated, then paint depth is read across every panel." },
      { t: "Cut and refine", d: "Heavier defects are cut out, then the finish is refined and polished." },
      { t: "Protect", d: "Ceramic coating or film goes on while the paint is at its best." },
    ],
  },
  {
    slug: "car-wash",
    name: "Car Wash",
    short: "A safe, hand-finished maintenance wash for coated and uncoated cars.",
    lede: "Two buckets, pH-neutral shampoo and no contact with anything that has touched another car. The wash that keeps a coating performing instead of wearing it down.",
    image: "/photo/hero-wash.webp",
    highlights: ["pH-neutral chemistry", "Coating-safe process", "Wheels and glass included"],
    body: [
      "Most coating damage is done at the wash, not on the road. Ours uses AUTOTRIZ Rich Foam Shampoo, clean mitts per panel and filtered water, so grit is lifted away rather than dragged across the paint.",
      "Coated cars get a Quick Coat top-up on request, which restores the beading and slickness between full details.",
    ],
    steps: [
      { t: "Pre-wash", d: "Foam dwells to loosen dirt before anything touches the paint." },
      { t: "Contact wash", d: "Two-bucket method, one mitt per section, wheels done separately." },
      { t: "Dry and dress", d: "Blown and towel-dried, glass cleaned, trim and tyres dressed." },
    ],
  },
];

export const certifications = [
  { name: "TÜV SÜD", note: "Independently tested" },
  { name: "SGS", note: "Inspected and certified" },
  { name: "ISO 9001:2015", note: "Quality management" },
  { name: "REACH", note: "SVHC-free compliance" },
];

export type NavItem = { name: string; href: string; note?: string };
export type NavGroup = { name: string; items: NavItem[] };

/** Header navigation. An entry either links somewhere directly or opens
 *  a dropdown, which is how the current site's bar behaves. */
export type HeaderEntry =
  | { name: string; href: string; items?: never }
  | { name: string; items: NavItem[]; href?: never };

/* The Shop group is not listed here: its entries are the categories
   marked "show in menu" in the admin, read from the database on every
   request. Everything else is fixed site structure. */
export const nav: NavGroup[] = [
  {
    name: "Services",
    items: services.map((s) => ({
      name: s.name,
      href: `/services/${s.slug}`,
      note: s.short,
    })),
  },
  {
    name: "Company",
    items: [
      { name: "About", href: "/about", note: "The science and the people" },
      { name: "Resources", href: "/resources", note: "Data sheets and guides" },
      { name: "Contact", href: "/contact", note: "Our Dhaka studio" },
    ],
  },
];

/* The header mirrors the live autotriz.com.bd bar: products, services,
   about, contact. The consumer range sits in the footer, as it does
   there — it is not a top-level entry. */
/** Built per request, so the Shop menu reflects the categories the
 *  admin chose. Everything after it is fixed. */
export function buildHeaderNav(shopItems: NavItem[]): HeaderEntry[] {
  return [
    ...(shopItems.length ? [{ name: "Shop", items: shopItems }] : []),
    { name: "Services", items: nav[0].items },
    { name: "Visualizer", href: "/visualizer" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];
}

export const footerLegal: NavItem[] = [
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Terms & Conditions", href: "/terms" },
  { name: "Return & Refund Policy", href: "/return-refund-policy" },
];

// The six protection claims the brand leads with.
export const benefits = [
  {
    id: "01",
    name: "Scratch Protection",
    body: "A cured matrix rated above 9H resists the swirls that wash mitts and automatic tunnels leave behind.",
  },
  {
    id: "02",
    name: "Chemical Resistance",
    body: "Bird lime, tree sap, road salt and industrial fallout sit on the coating instead of etching the clear coat.",
  },
  {
    id: "03",
    name: "UV Protection",
    body: "Blocks the ultraviolet load that oxidises pigment and fades a finish long before the panel ever rusts.",
  },
  {
    id: "04",
    name: "Anti-Fouling",
    body: "A low-energy surface gives dirt, brake dust and organic growth almost nothing to hold on to.",
  },
  {
    id: "05",
    name: "Stain Resistance",
    body: "Water spotting and mineral deposits release under a normal wash rather than needing correction.",
  },
  {
    id: "06",
    name: "Corrosion Protection",
    body: "A continuous, non-porous barrier keeps moisture and chloride away from the substrate underneath.",
  },
];
