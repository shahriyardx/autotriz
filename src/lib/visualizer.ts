/* ==================================================================
   COATING VISUALIZER — the settings the 3D scene is driven from.

   Nothing here touches three.js, so both the server page and the
   client scene can read it. A finish is a set of numbers handed to a
   `MeshPhysicalMaterial`; a colour is the paint underneath it.
   ================================================================== */

/** One coating, described the way the renderer needs it.
 *
 *  `clearcoat` is the lacquer sitting on the paint — a ceramic coating
 *  is a second, harder one on top, so gloss finishes push it to 1 with
 *  almost no roughness. Matte and satin keep the layer but scatter it,
 *  which is what kills the mirror reflection.
 *
 *  The rest are the optional tricks: `sheen` is the soft halo of a
 *  pearl, `iridescence` is a thin film that shifts colour with the
 *  angle you look from, and `pattern` swaps the flat colour for a
 *  woven surface. */
export type Finish = {
  key: string;
  name: string;
  short: string;
  blurb: string;
  metalness: number;
  roughness: number;
  clearcoat: number;
  clearcoatRoughness: number;
  /** How hard the studio reflects in the paint. */
  envIntensity: number;
  /** Pearl halo, 0 to 1. */
  sheen?: number;
  sheenRoughness?: number;
  /** Thin-film colour shift, 0 to 1, and how thick the film is in
   *  nanometres — thicker swings further round the spectrum. */
  iridescence?: number;
  iridescenceThickness?: [number, number];
  /** Brushed, directional highlight. */
  anisotropy?: number;
};

export const FINISHES: Finish[] = [
  {
    key: "uncoated",
    name: "Factory Paint",
    short: "No coating",
    blurb:
      "Bare clear coat after a few seasons. Fine swirls scatter the light, so reflections go soft and the colour reads flat.",
    metalness: 0.45,
    roughness: 0.62,
    clearcoat: 0.35,
    clearcoatRoughness: 0.5,
    envIntensity: 0.85,
  },
  {
    key: "ceramic-gloss",
    name: "Ceramic Gloss",
    short: "9H ceramic",
    blurb:
      "Our flagship polysilazane coating. A second glass-hard layer over the clear coat — mirror reflections, deeper colour, water that will not sit still.",
    metalness: 0.62,
    roughness: 0.28,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envIntensity: 1.25,
  },
  {
    key: "ceramic-matte",
    name: "Ceramic Matte",
    short: "Matte ceramic",
    blurb:
      "Same protection, no shine. Made for factory matte and satin paint, where a gloss coating would ruin the finish.",
    metalness: 0.35,
    roughness: 0.86,
    clearcoat: 0.5,
    clearcoatRoughness: 0.85,
    envIntensity: 0.9,
  },
  {
    key: "pearl",
    name: "Pearl Lustre",
    short: "Pearl top coat",
    blurb:
      "Fine mica in the top layer throws a soft white halo across the panel, so the colour lifts as the light moves round it.",
    metalness: 0.3,
    roughness: 0.38,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envIntensity: 1.15,
    sheen: 1,
    sheenRoughness: 0.3,
  },
  {
    key: "metallic",
    name: "Metallic Flake",
    short: "Metallic",
    blurb:
      "Aluminium flake suspended in the base coat. The panel goes bright where it faces the light and drops away sharply where it turns.",
    metalness: 0.96,
    roughness: 0.26,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envIntensity: 1.35,
  },
  {
    key: "flip",
    name: "Colour Flip",
    short: "Two-tone",
    blurb:
      "A thin film over the paint that reads one colour head on and another down the flank. Subtle from a distance, obvious as you walk past.",
    metalness: 0.6,
    roughness: 0.26,
    clearcoat: 1,
    clearcoatRoughness: 0.03,
    envIntensity: 1.25,
    iridescence: 1,
    iridescenceThickness: [260, 560],
  },
  {
    key: "iridescent",
    name: "Iridescent",
    short: "Full spectrum",
    blurb:
      "The same film, much thicker. The whole spectrum runs across the bodywork as it turns — a wrap finish, not a coating.",
    metalness: 0.55,
    roughness: 0.22,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envIntensity: 1.3,
    iridescence: 1,
    iridescenceThickness: [100, 1100],
  },
  {
    key: "brushed",
    name: "Brushed Metal",
    short: "Anodised",
    blurb:
      "Grain running the length of the panel, so the highlight smears into a line instead of a point. An anodised wrap look.",
    metalness: 0.95,
    roughness: 0.4,
    clearcoat: 0.7,
    clearcoatRoughness: 0.25,
    envIntensity: 1.2,
    anisotropy: 0.9,
  },
  {
    key: "ppf-gloss",
    name: "PPF Gloss",
    short: "Paint protection film",
    blurb:
      "Self-healing urethane film over the paint. Slightly softer than bare ceramic because the film has real thickness — and it stops stone chips outright.",
    metalness: 0.6,
    roughness: 0.36,
    clearcoat: 1,
    clearcoatRoughness: 0.05,
    envIntensity: 1.15,
  },
  {
    key: "ppf-satin",
    name: "PPF Satin",
    short: "Satin film",
    blurb:
      "The same film with a silk top surface. Turns any gloss paint satin, and turns back when the film comes off.",
    metalness: 0.4,
    roughness: 0.7,
    clearcoat: 0.85,
    clearcoatRoughness: 0.55,
    envIntensity: 1,
  },
];

/* ------------------------------------------------------------------
   PAINT
   ------------------------------------------------------------------ */

export type PaintColour = { key: string; name: string; hex: string };

/** A family of shades, the way a wrap catalogue is laid out: pick the
 *  colour you want, then the exact shade within it. */
export type ColourFamily = {
  key: string;
  name: string;
  /** The chip that stands for the family in the picker. */
  swatch: string;
  shades: PaintColour[];
};

export const COLOUR_FAMILIES: ColourFamily[] = [
  {
    key: "white",
    name: "White",
    swatch: "#e9ebec",
    shades: [
      { key: "arctic-white", name: "Arctic White", hex: "#e9ebec" },
      { key: "pearl-white", name: "Pearl White", hex: "#f2f1ec" },
      { key: "alpine", name: "Alpine", hex: "#dcdfe1" },
      { key: "ivory", name: "Ivory", hex: "#e6e0d2" },
      { key: "chalk", name: "Chalk", hex: "#cfd0cb" },
    ],
  },
  {
    key: "silver",
    name: "Silver",
    swatch: "#b9bfc5",
    shades: [
      { key: "pearl-silver", name: "Pearl Silver", hex: "#b9bfc5" },
      { key: "liquid-silver", name: "Liquid Silver", hex: "#c9ced2" },
      { key: "titanium", name: "Titanium", hex: "#9ea4a8" },
      { key: "platinum", name: "Platinum", hex: "#d2d6d6" },
      { key: "frost", name: "Frost", hex: "#aebac2" },
    ],
  },
  {
    key: "grey",
    name: "Grey",
    swatch: "#7e848a",
    shades: [
      { key: "nardo-grey", name: "Nardo Grey", hex: "#7e848a" },
      { key: "cement", name: "Cement", hex: "#8d8b84" },
      { key: "slate", name: "Slate", hex: "#5d666e" },
      { key: "graphite", name: "Graphite", hex: "#4a5057" },
      { key: "ash", name: "Ash", hex: "#6b6f70" },
    ],
  },
  {
    key: "black",
    name: "Black",
    swatch: "#0c0e10",
    shades: [
      { key: "jet-black", name: "Jet Black", hex: "#0c0e10" },
      { key: "obsidian", name: "Obsidian", hex: "#15181c" },
      { key: "midnight", name: "Midnight", hex: "#121820" },
      { key: "onyx", name: "Onyx", hex: "#1c1c1e" },
      { key: "anthracite", name: "Anthracite", hex: "#2a2e32" },
    ],
  },
  {
    key: "red",
    name: "Red",
    swatch: "#b3121f",
    shades: [
      { key: "scarlet", name: "Scarlet Red", hex: "#b3121f" },
      { key: "rosso", name: "Rosso", hex: "#c8102e" },
      { key: "candy-red", name: "Candy Red", hex: "#8f0713" },
      { key: "wine", name: "Wine", hex: "#5d1220" },
      { key: "cherry", name: "Cherry", hex: "#d4293a" },
    ],
  },
  {
    key: "orange",
    name: "Orange",
    swatch: "#c9520d",
    shades: [
      { key: "burnt-orange", name: "Burnt Orange", hex: "#c9520d" },
      { key: "sunset", name: "Sunset", hex: "#e2661a" },
      { key: "copper", name: "Copper", hex: "#a45325" },
      { key: "amber", name: "Amber", hex: "#d8791b" },
      { key: "coral", name: "Coral", hex: "#d4604b" },
    ],
  },
  {
    key: "yellow",
    name: "Yellow",
    swatch: "#e0a90b",
    shades: [
      { key: "sunburst", name: "Sunburst", hex: "#e0a90b" },
      { key: "racing-yellow", name: "Racing Yellow", hex: "#f2c400" },
      { key: "lemon", name: "Lemon", hex: "#e8d64a" },
      { key: "mustard", name: "Mustard", hex: "#c0930f" },
      { key: "sand", name: "Desert Sand", hex: "#b9a483" },
    ],
  },
  {
    key: "gold",
    name: "Gold",
    swatch: "#7d5a30",
    shades: [
      { key: "bronze", name: "Liquid Bronze", hex: "#7d5a30" },
      { key: "champagne", name: "Champagne", hex: "#c2a878" },
      { key: "antique-gold", name: "Antique Gold", hex: "#9a7b32" },
      { key: "brass", name: "Brass", hex: "#8e6f3a" },
      { key: "khaki", name: "Khaki", hex: "#6f6547" },
    ],
  },
  {
    key: "green",
    name: "Green",
    swatch: "#13402a",
    shades: [
      { key: "racing-green", name: "Racing Green", hex: "#13402a" },
      { key: "emerald", name: "Emerald", hex: "#12664a" },
      { key: "forest", name: "Forest", hex: "#1f4a2c" },
      { key: "olive", name: "Olive", hex: "#4d5230" },
      { key: "mint", name: "Mint", hex: "#8fbfa6" },
    ],
  },
  {
    key: "blue",
    name: "Blue",
    swatch: "#123a72",
    shades: [
      { key: "deep-ocean", name: "Deep Ocean", hex: "#123a72" },
      { key: "sapphire", name: "Sapphire", hex: "#1b4f9c" },
      { key: "cobalt", name: "Cobalt", hex: "#1160c4" },
      { key: "navy", name: "Navy", hex: "#101d3d" },
      { key: "ice-blue", name: "Ice Blue", hex: "#8fb3ce" },
    ],
  },
  {
    key: "purple",
    name: "Purple",
    swatch: "#4b2b8f",
    shades: [
      { key: "violet", name: "Violet", hex: "#4b2b8f" },
      { key: "amethyst", name: "Amethyst", hex: "#6b46b3" },
      { key: "indigo", name: "Indigo", hex: "#2e2160" },
      { key: "plum", name: "Plum", hex: "#54284c" },
      { key: "lavender", name: "Lavender", hex: "#a793cc" },
    ],
  },
  {
    key: "pink",
    name: "Pink",
    swatch: "#c2708a",
    shades: [
      { key: "blush", name: "Blush Pink", hex: "#c2708a" },
      { key: "rose", name: "Rose", hex: "#c85f76" },
      { key: "magenta", name: "Magenta", hex: "#a81f63" },
      { key: "fuchsia", name: "Fuchsia", hex: "#d33e94" },
      { key: "salmon", name: "Salmon", hex: "#dd8f83" },
    ],
  },
];

/** Every shade in one list, for looking one up by key. */
export const COLOURS: PaintColour[] = COLOUR_FAMILIES.flatMap((f) => f.shades);

export function familyOf(colourKey: string): ColourFamily {
  return (
    COLOUR_FAMILIES.find((f) => f.shades.some((s) => s.key === colourKey)) ??
    COLOUR_FAMILIES[0]
  );
}



/* ------------------------------------------------------------------
   CARS
   ------------------------------------------------------------------ */

/** Which material inside the file is which. Names come from whoever
 *  built the model, so they are listed per car — the scene falls back
 *  to guessing from the name when a model is not listed here. */
export type CarModel = {
  key: string;
  name: string;
  note: string;
  file: string;
  credit?: string;
  /** Materials that are the painted bodywork. */
  paint: string[];
  /** Framing: where the camera starts and how close it may get. */
  camera: { position: [number, number, number]; target: [number, number, number] };
  distance: { min: number; max: number };
  /** How long the real car is, in metres. Models arrive in whatever
   *  units their maker used, so the scene measures each one and
   *  resizes it to this — one number instead of guessing a scale. */
  length: number;
};

export const CARS: CarModel[] = [
  {
    key: "huracan",
    name: "Huracán",
    note: "Mid-engine supercar",
    file: "/visualizer/huracan.glb",
    credit:
      'Based on "Lamborghini Huracan" by Outlaw Games\u2122 on Sketchfab, CC BY-NC 4.0',
    paint: ["Paint1Mtl"],
    camera: { position: [4.3, 1.45, -5.1], target: [0, 1.0, 0] },
    distance: { min: 3.2, max: 10 },
    length: 4.46,
  },
  {
    key: "coupe",
    name: "Sports Coup\u00e9",
    note: "Two-door, folding roof",
    file: "/visualizer/ferrari.glb",
    credit: "Model from the three.js project",
    paint: ["Body_Color"],
    camera: { position: [4.2, 1.4, -5.0], target: [0, 1.0, 0] },
    distance: { min: 3.2, max: 9.5 },
    length: 4.53,
  },
];

export const DEFAULT_CAR = CARS[0];
export const DEFAULT_FINISH = FINISHES[1];
export const DEFAULT_COLOUR = COLOURS[0];
