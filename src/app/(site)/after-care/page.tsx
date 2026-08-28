import type { Metadata } from "next";
import { CategoryPage } from "@/components/category-page";

export const metadata: Metadata = {
  title: "After Care",
  description:
    "Wash, wheel and maintenance chemistry formulated to keep an AUTOTRIZ ceramic coating hydrophobic for its full service life.",
};

export default function Page() {
  return (
    <CategoryPage
      slug="aftercare"
      title="After"
      accent="Care"
      subhead="Maintenance decides lifespan"
      lede="A coating does not wear out so much as it gets buried. High-pH traffic film removers and cheap shampoo close the surface up. These do not."
      notes={[
        { k: "pH", v: "Coating-safe" },
        { k: "Gloss", v: "SiO₂ enhanced" },
        { k: "Use", v: "Every wash" },
        { k: "Formats", v: "Retail and 4 L" },
      ]}
    />
  );
}
