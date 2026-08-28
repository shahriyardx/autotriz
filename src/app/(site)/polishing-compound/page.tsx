import type { Metadata } from "next";
import { CategoryPage } from "@/components/category-page";

export const metadata: Metadata = {
  title: "Polishing Compound",
  description:
    "A six-step cut-to-finish polishing system with no fillers and no silicone, engineered for modern OEM and refinish paint.",
};

export default function Page() {
  return (
    <CategoryPage
      slug="polish"
      title="Polishing"
      accent="Compound"
      subhead="Cut, refine and finish"
      lede="Fillers hide defects for a few weeks and then hand them back. Nothing in this range contains filler or silicone, so what you see after the polish is what the coating locks in."
      notes={[
        { k: "Steps", v: "Heavy to finishing" },
        { k: "Fillers", v: "None" },
        { k: "Silicone", v: "None" },
        { k: "Paint systems", v: "OEM and refinish" },
      ]}
    />
  );
}
