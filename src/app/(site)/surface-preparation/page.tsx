import type { Metadata } from "next";
import { CategoryPage } from "@/components/category-page";

export const metadata: Metadata = {
  title: "Surface Preparation",
  description:
    "Decontamination and panel wipe chemistry: iron fallout removal, water spot correction, degreasing and final surface prep before coating.",
};

export default function Page() {
  return (
    <CategoryPage
      slug="prep"
      title="Surface"
      accent="Preparation"
      subhead="Nothing bonds to contamination"
      lede="Every failed coating fails at the interface, not in the film. This range exists to make sure there is nothing between the resin and the clear coat."
      notes={[
        { k: "Iron fallout", v: "Colour-change removal" },
        { k: "Mineral spotting", v: "Acid-safe correction" },
        { k: "Oils and waxes", v: "Full strip" },
        { k: "Final step", v: "Panel wipe" },
      ]}
    />
  );
}
