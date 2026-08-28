import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Coating Visualizer",
  description:
    "Stand a car in our studio and change its coating. Ceramic gloss, matte, paint protection film — pick a colour and turn it in 3D.",
};

/** No header, no footer, no scrollbar. The visualizer takes the whole
 *  window, so the storefront chrome is deliberately left behind. */
export default function VisualizerLayout({ children }: { children: React.ReactNode }) {
  return <div className="fixed inset-0 overflow-hidden">{children}</div>;
}
