import type { Metadata } from "next";
import { CategoryPage } from "@/components/category-page";

export const metadata: Metadata = {
  title: "Automotive Ceramic Coating",
  description:
    "Professional polysilazane ceramic coatings for paint, glass, wheels, plastic, leather and fabric. Cured above 9H and removable only by machine polishing.",
};

export default function Page() {
  return (
    <CategoryPage
      slug="coating"
      title="Ceramic"
      accent="Coating"
      subhead="The world's best nano ceramic coating"
      lede="Ten formulations, one chemistry. Each is tuned to a single substrate so the coating bonds to that surface properly instead of compromising across all of them."
      image="/photo/coating-application.webp"
      notes={[
        { k: "Hardness", v: "Above 9H" },
        { k: "Binder", v: "Polysilazane" },
        { k: "Structure", v: "3D matrix nano" },
        { k: "Removal", v: "Machine polish only" },
      ]}
    />
  );
}
