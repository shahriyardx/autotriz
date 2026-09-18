/**
 * Fills an empty shop with demo products, so the storefront can be
 * looked at before the real catalogue is entered.
 *
 *   pnpm db:seed:demo      add anything missing
 *   pnpm db:seed:demo --reset   delete the demo products first
 *
 * These are placeholders with invented prices and stock. They are kept
 * out of `pnpm db:seed` deliberately: a deployment should never grow a
 * catalogue on its own. Every one is matched by slug, so running this
 * twice adds nothing and running it after real products are entered
 * leaves them alone.
 */
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { categories, productCategories, products } from "@/db/schema";

type Demo = {
  slug: string;
  name: string;
  sku: string;
  /** Slug of the category it belongs to. */
  category: string;
  surface: string;
  shortDescription: string;
  description: string;
  /** Taka. Converted to minor units on the way in. */
  price: number;
  /** Taka, when it is on offer. */
  salePrice?: number;
  size: string;
  features: string[];
  stock: number;
  featured?: boolean;
};

/* Images are the ones already sitting in `public/products`, so nothing
   has to be uploaded for these to render. */
const image = (slug: string) => `/products/${slug}.webp`;

const DEMO: Demo[] = [
  {
    slug: "autotriz-3d-matrix-pro",
    name: "AUTOTRIZ 3D Matrix Pro",
    sku: "AT-3DM-PRO-50",
    category: "coating",
    surface: "Paint",
    shortDescription: "Our flagship 9H polysilazane coating for professional application.",
    description:
      "A cured 3D matrix nano structure above 9H, laid over corrected paint by a trained installer. Two coats give a deep gloss, hard water beading and a surface that releases dirt instead of holding it.\n\nSupplied with applicator, suede cloths and a certificate of application.",
    price: 18500,
    size: "50 ml",
    features: ["Above 9H hardness", "5 year durability", "Hydrophobic", "Professional use"],
    stock: 24,
    featured: true,
  },
  {
    slug: "autotriz-3d-matrix-ultra",
    name: "AUTOTRIZ 3D Matrix Ultra",
    sku: "AT-3DM-ULT-50",
    category: "coating",
    surface: "Paint",
    shortDescription: "The longest-lasting coating in the range, for show and concours cars.",
    description:
      "Ultra carries a higher solids content than Pro, so a single layer builds more thickness and holds its gloss longer. Intended for paint that has been fully corrected first.",
    price: 26500,
    salePrice: 22500,
    size: "50 ml",
    features: ["Above 9H hardness", "7 year durability", "High solids", "Single layer"],
    stock: 12,
    featured: true,
  },
  {
    slug: "autotriz-3d-matrix-hybrid",
    name: "AUTOTRIZ 3D Matrix Hybrid",
    sku: "AT-3DM-HYB-50",
    category: "coating",
    surface: "Paint",
    shortDescription: "Silicon and polysilazane together — easier to lay, quick to flash.",
    description:
      "Hybrid chemistry forgives a warmer workshop and a faster pace, which makes it the sensible choice for a busy detailing bay without giving up the hardness of the range.",
    price: 14500,
    size: "50 ml",
    features: ["Forgiving flash time", "3 year durability", "Warm climate friendly"],
    stock: 30,
  },
  {
    slug: "autotriz-glass-pro",
    name: "AUTOTRIZ Glass Pro",
    sku: "AT-GLS-PRO-30",
    category: "coating",
    surface: "Glass",
    shortDescription: "Rain repellent coating for windscreens and side glass.",
    description:
      "Water leaves the screen at speed instead of sitting on it, so wipers do less and night driving in rain is easier on the eyes.",
    price: 4900,
    size: "30 ml",
    features: ["12 month durability", "Reduces wiper use", "Clear, no distortion"],
    stock: 40,
    featured: true,
  },
  {
    slug: "autotriz-wheel-caliper",
    name: "AUTOTRIZ Wheel & Caliper",
    sku: "AT-WHL-CAL-30",
    category: "coating",
    surface: "Wheels",
    shortDescription: "Heat-resistant coating for wheel faces, barrels and calipers.",
    description:
      "Brake dust bakes onto a hot wheel and stays there. Coated, it sits on the surface and comes away with a rinse.",
    price: 6500,
    size: "30 ml",
    features: ["Heat resistant to 800°C", "Brake dust release", "18 month durability"],
    stock: 26,
  },
  {
    slug: "autotriz-leather-vinyl",
    name: "AUTOTRIZ Leather & Vinyl",
    sku: "AT-LEA-VIN-100",
    category: "coating",
    surface: "Interior",
    shortDescription: "Breathable protection for seats, dashboards and door cards.",
    description:
      "Guards against dye transfer from denim, spills and the UV that cracks a dashboard, without leaving the shine that makes an interior look wet.",
    price: 5200,
    size: "100 ml",
    features: ["Matte finish", "UV protection", "Dye transfer resistant"],
    stock: 35,
  },
  {
    slug: "heavy-cut",
    name: "Heavy Cut Compound",
    sku: "AT-PC-HC-1L",
    category: "polish",
    surface: "Paint",
    shortDescription: "First-stage compound for deep defects and sanding marks.",
    description:
      "Cuts hard and finishes better than it has any right to, so the follow-up stage is shorter. Works with wool or microfibre on a rotary or a long-throw machine.",
    price: 3200,
    size: "1 L",
    features: ["Heavy cut", "Low dust", "Body shop safe"],
    stock: 48,
  },
  {
    slug: "ultra-cut",
    name: "Ultra Cut Polish",
    sku: "AT-PC-UC-1L",
    category: "polish",
    surface: "Paint",
    shortDescription: "Second stage: removes the haze a heavy cut leaves behind.",
    description:
      "Refines the finish to the point where most paint is ready to coat, with enough bite to correct light swirls on its own.",
    price: 2900,
    size: "1 L",
    features: ["Medium cut", "Body shop safe", "Machine or rotary"],
    stock: 52,
  },
  {
    slug: "final-cut",
    name: "Final Cut Finishing Polish",
    sku: "AT-PC-FC-1L",
    category: "polish",
    surface: "Paint",
    shortDescription: "The last pass before coating, for a defect-free finish.",
    description:
      "A fine finishing polish for dark paint, where any remaining haze shows. Leaves nothing behind for the coating to bond through.",
    price: 2700,
    size: "1 L",
    features: ["Finishing", "Dark paint safe", "No fillers"],
    stock: 44,
  },
  {
    slug: "iron-remover",
    name: "Iron Remover",
    sku: "AT-PREP-IR-1L",
    category: "prep",
    surface: "Paint",
    shortDescription: "Dissolves embedded brake dust and rail dust before polishing.",
    description:
      "Turns purple as it works, so you can see the contamination lifting. Use before clay and before any coating goes near the paint.",
    price: 1800,
    size: "1 L",
    features: ["Colour changing", "pH balanced", "Safe on coatings"],
    stock: 60,
  },
  {
    slug: "surface-prep",
    name: "Surface Prep Spray",
    sku: "AT-PREP-SP-500",
    category: "prep",
    surface: "Paint",
    shortDescription: "The final wipe-down that strips oils so the coating can bond.",
    description:
      "Polishing oils left on the paint are the most common reason a coating fails early. This removes them and flashes off clean.",
    price: 1400,
    size: "500 ml",
    features: ["Residue free", "Fast flash", "Use before coating"],
    stock: 70,
  },
  {
    slug: "rich-foam-shampoo",
    name: "Rich Foam Shampoo",
    sku: "AT-AC-RFS-1L",
    category: "aftercare",
    surface: "Paint",
    shortDescription: "pH neutral maintenance wash that will not strip a coating.",
    description:
      "Thick foam, plenty of lubrication and no gloss enhancers to mask what is underneath. The wash to use on a coated car every fortnight.",
    price: 1200,
    size: "1 L",
    features: ["pH neutral", "Coating safe", "High foam"],
    stock: 85,
  },
  {
    slug: "quick-coat",
    name: "Quick Coat Topper",
    sku: "AT-AC-QC-500",
    category: "aftercare",
    surface: "Paint",
    shortDescription: "A drying aid that tops up the beading between services.",
    description:
      "Sprayed onto wet paint and dried off, it refreshes water behaviour and adds slickness without building anything the next service has to remove.",
    price: 1600,
    size: "500 ml",
    features: ["Use while drying", "Tops up beading", "Streak free"],
    stock: 64,
  },
  {
    slug: "ion-plus",
    name: "ION Plus DIY Coating",
    sku: "AT-CON-ION-100",
    category: "consumer",
    surface: "Paint",
    shortDescription: "Coating protection a car owner can apply at home in an afternoon.",
    description:
      "The chemistry of the professional range in a form that forgives a driveway and a first attempt. Comes with applicator, cloths and step-by-step instructions.",
    price: 3800,
    salePrice: 2990,
    size: "100 ml",
    features: ["No machine needed", "12 month durability", "Kit included"],
    stock: 90,
  },
];

async function run() {
  const reset = process.argv.includes("--reset");
  const slugs = DEMO.map((d) => d.slug);

  if (reset) {
    const removed = await db
      .delete(products)
      .where(inArray(products.slug, slugs))
      .returning({ slug: products.slug });
    console.info(`  removed ${removed.length} demo products`);
  }

  const rows = await db.select({ id: categories.id, slug: categories.slug }).from(categories);
  const categoryId = new Map(rows.map((row) => [row.slug, row.id]));

  let added = 0;
  let skipped = 0;

  for (const [index, demo] of DEMO.entries()) {
    const category = categoryId.get(demo.category);
    if (!category) {
      console.warn(`  ! no category "${demo.category}" — skipping ${demo.slug}`);
      continue;
    }

    const [existing] = await db
      .select({ id: products.id })
      .from(products)
      .where(eq(products.slug, demo.slug))
      .limit(1);

    if (existing) {
      skipped += 1;
      continue;
    }

    const [created] = await db
      .insert(products)
      .values({
        slug: demo.slug,
        name: demo.name,
        sku: demo.sku,
        categoryId: category,
        surface: demo.surface,
        shortDescription: demo.shortDescription,
        description: demo.description,
        // Taka in, minor units stored.
        price: demo.price * 100,
        salePrice: demo.salePrice ? demo.salePrice * 100 : null,
        size: demo.size,
        features: demo.features,
        image: image(demo.slug),
        stock: demo.stock,
        featured: demo.featured ?? false,
        sortOrder: index,
      })
      .returning({ id: products.id });

    // The primary category is mirrored into the join table, as the
    // admin does when a product is saved there.
    await db.insert(productCategories).values({ productId: created.id, categoryId: category });
    added += 1;
  }

  console.info(`  products: ${added} added, ${skipped} already there`);
  console.info(`  featured: ${DEMO.filter((d) => d.featured).length} (the shop banner)`);
}

run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
