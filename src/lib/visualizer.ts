/* ==================================================================
   COATING VISUALIZER — the settings the 3D scene is driven from.

   Nothing here touches three.js, so both the server page and the
   client scene can read it. A finish is a set of numbers handed to a
   `MeshPhysicalMaterial`; a colour is the paint underneath it.
   ================================================================== */

/** One coating, described the way the renderer needs it.
 *
 *  `clearcoat` is the lacquer layer sitting on the paint — a ceramic
 *  coating is a second, harder one on top, so gloss finishes push it
 *  to 1 with almost no roughness. Matte and satin keep the layer but
 *  scatter it, which is what kills the mirror reflection. */
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

export const COLOURS: PaintColour[] = [
  { key: "arctic-white", name: "Arctic White", hex: "#e9ebec" },
  { key: "pearl-silver", name: "Pearl Silver", hex: "#b9bfc5" },
  { key: "gunmetal", name: "Gunmetal", hex: "#4a5057" },
  { key: "jet-black", name: "Jet Black", hex: "#0c0e10" },
  { key: "scarlet", name: "Scarlet Red", hex: "#b3121f" },
  { key: "deep-blue", name: "Deep Ocean", hex: "#123a72" },
  { key: "racing-green", name: "Racing Green", hex: "#13402a" },
  { key: "bronze", name: "Liquid Bronze", hex: "#7d5a30" },
  { key: "sunburst", name: "Sunburst", hex: "#e0a90b" },
  { key: "sand", name: "Desert Sand", hex: "#b9a483" },
];

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
