import type { FaqItem } from "@/components/faq";

/* ==================================================================
   The questions people actually ask, and the answers.

   Kept together in one file rather than scattered through the pages
   that show them, so the wording can be corrected in one place — and
   so a claim made on the shop cannot quietly contradict the same
   claim made on a service page.

   Prices and turnaround times live here. Check them before they go
   out of date.
   ================================================================== */

export const homeFaq: FaqItem[] = [
  {
    q: "What is a ceramic coating, and how is it different from wax?",
    a: "Wax sits on the paint and washes off over months. A ceramic coating bonds to the clear coat and cures into a glass-hard layer measured above 9H, so it resists the washing, UV and road grime that strip wax away. It is measured in years, not weeks.",
  },
  {
    q: "How long does a coating last?",
    a: "Between three and seven years depending on the product, how the car is washed and where it is parked. Our **3D Matrix Ultra** is the longest-lasting; **Hybrid** is the shortest and the easiest to apply. Every coating lasts longer if it is washed with a pH-neutral shampoo rather than a traffic film remover.",
  },
  {
    q: "Can I apply it myself, or does it need a professional?",
    a: "Both are possible. The professional range assumes corrected paint and a controlled workshop. **ION Plus** is made for a car owner with an afternoon and a driveway — no machine polisher needed. If your paint has swirls in it, have it corrected first: a coating locks in whatever is underneath.",
  },
  {
    q: "Do you deliver across Bangladesh?",
    a: "Yes, nationwide. Orders over ৳150 ship free. Cash on delivery is available, and you can pick up from the Dhaka studio if you prefer.",
  },
  {
    q: "Is AUTOTRIZ sold anywhere else in Bangladesh?",
    a: "This is the official AUTOTRIZ presence for Bangladesh, run from one studio in Dhaka. Stock bought here is genuine and covered. If you have been offered AUTOTRIZ elsewhere and want it checked, [ask us](/contact).",
  },
];

export const servicesFaq: FaqItem[] = [
  {
    q: "How long will my car be with you?",
    a: "A full-body paint protection film fit is usually two days. A coating on corrected paint is one to two days, most of which is curing rather than work. A polish or a wash is the same day. We tell you the real figure when we see the car, not before.",
  },
  {
    q: "Do I need paint correction before a coating?",
    a: "Usually, yes — and it is the part people try to skip. A coating seals in whatever is under it, so swirls and scratches get locked in for years. We will tell you honestly if your paint does not need it.",
  },
  {
    q: "What is the difference between film and coating?",
    a: "A coating is chemistry: it changes how the surface behaves, so dirt releases and water runs off. Film is a physical layer of urethane thick enough to absorb a stone chip. Coating protects the look; film protects the panel. Many cars get film on the front and coating everywhere else.",
  },
  {
    q: "Is there a warranty?",
    a: "Paint protection film carries a ten-year film warranty against yellowing, cracking and lifting. Coatings are warranted for the durability quoted on the product, provided the car is maintained as we set out at handover.",
  },
  {
    q: "Do you work on motorcycles and commercial vehicles?",
    a: "Yes. The chemistry is the same; the pricing and the time are not. [Tell us what you ride or run](/contact) and we will quote it.",
  },
];

/** Shown on every product page. Deliberately about buying rather than
 *  about any one product — a shampoo and a coating share a checkout,
 *  not a cure time. */
export const productFaq: FaqItem[] = [
  {
    q: "Is this genuine AUTOTRIZ stock?",
    a: "Yes. This is the official AUTOTRIZ shop for Bangladesh and everything here comes from the manufacturer. Nothing is repackaged or decanted.",
  },
  {
    q: "How much is delivery, and how long does it take?",
    a: "Free over ৳150, a flat ৳120 below that. Dhaka is usually next day; the rest of the country is two to four days. Cash on delivery is available everywhere we ship.",
  },
  {
    q: "Can I have it fitted instead of doing it myself?",
    a: "Yes — the Dhaka studio applies everything sold here. [Ask us about it](/contact?topic=services) and we will quote the car rather than the bottle.",
  },
  {
    q: "What if I order the wrong thing?",
    a: "Unopened products can be returned within seven days. If you are not sure which product suits your paint, ask before you buy — we would rather answer a question than process a return.",
  },
  {
    q: "Do you sell to detailers and workshops?",
    a: "Yes, on trade terms. [Get in touch](/contact) with what you use and how much of it.",
  },
];

/** Per service, by slug. A service with nothing here falls back to the
 *  general set above. */
export const serviceFaq: Record<string, FaqItem[]> = {
  "ppf-installation": [
    {
      q: "Will the film be visible?",
      a: "Not from a normal viewing distance. Patterns are plotter-cut for your exact model and the edges are wrapped out of sight, so nothing is trimmed on the paint and there is no seam running down a panel.",
    },
    {
      q: "Does it really heal itself?",
      a: "The top coat re-flows with warmth, so light swirls and wash marks disappear on their own — sunshine is usually enough. It will not heal a deep gouge that has gone through the film.",
    },
    {
      q: "Full body or just the front?",
      a: "Most cars here get the front: bonnet, bumper, wings and mirrors, which is where stone chips land. Full body is worth it on a car that is kept long term or parked outside.",
    },
    {
      q: "Can film go over a ceramic coating?",
      a: "It is the wrong way round. Film goes on the paint and the coating goes over the film, which keeps the film itself easy to clean. If your car is already coated we remove the coating from the panels being filmed.",
    },
  ],
  "window-tint": [
    {
      q: "Is tint legal in Bangladesh?",
      a: "Rules on windscreen and front-side tint are enforced, and they change. We fit to what is currently permitted and will tell you plainly what we will not fit, whatever the request.",
    },
    {
      q: "Will it go purple?",
      a: "Cheap dyed film does. Ours is a metal-free ceramic film that rejects heat by construction rather than by dye, so it holds its colour rather than fading to purple in a Dhaka summer.",
    },
    {
      q: "Does it block phone or GPS signal?",
      a: "No. Metallic films can interfere with signal; ceramic film does not.",
    },
  ],
  "car-polish": [
    {
      q: "How often should paint be polished?",
      a: "As rarely as possible. Every polish removes a little clear coat, so the honest answer is: when the paint actually needs it, and not on a schedule. A coated car that is washed properly may never need it again.",
    },
    {
      q: "Will it remove every scratch?",
      a: "Anything above the clear coat, yes. If your fingernail catches in a scratch it has gone too deep to polish out safely, and we will say so rather than thin the paint chasing it.",
    },
  ],
  "car-wash": [
    {
      q: "Is a hand wash really better?",
      a: "Yes. Automatic brushes are the most common cause of the swirl marks people later pay to have polished out. Two buckets, a grit guard and clean mitts cost more in time and less in paint.",
    },
    {
      q: "How should I wash a coated car at home?",
      a: "pH-neutral shampoo, two buckets, top down, and dry with a clean microfibre towel. Avoid traffic film removers and anything strongly alkaline — those close up the surface and undo what the coating does.",
    },
  ],
};
