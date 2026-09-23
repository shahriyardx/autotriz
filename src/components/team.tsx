import Image from "next/image";
import { Reveal } from "@/components/reveal";
import { Band } from "@/components/ui";
import { team } from "@/lib/site";

/* ==================================================================
   THE PEOPLE WHO DO THE WORK

   A portrait per member over a caption carrying the name and the job.
   A member without a photo shows the brand mark instead, so a row of
   cards stays even while pictures are still being taken.
   ================================================================== */

function Dashed({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex items-center justify-center gap-3">
      <span aria-hidden className="h-px w-6 bg-primary" />
      {children}
      <span aria-hidden className="h-px w-6 bg-primary" />
    </span>
  );
}

export function Team({
  eyebrow = "Our experts",
  subhead = "Our skilled team is passionate about cars and committed to delivering perfection with every service.",
}: {
  eyebrow?: string;
  subhead?: string;
}) {
  if (!team.length) return null;

  return (
    <Band tone="dark">
      <div className="shell">
        <div className="text-center">
          <p className="label text-primary">
            <Dashed>{eyebrow}</Dashed>
          </p>
          <h2 className="display mt-5 text-[clamp(1.75rem,3.4vw,2.75rem)] text-foreground">
            <span className="accent">Meet</span> the professionals
          </h2>
          <p className="subhead mt-4">{subhead}</p>
        </div>

        <ul className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {team.map((member, i) => (
            <Reveal
              as="li"
              key={`${member.name}-${i}`}
              delay={i}
              className="border border-foreground/15 bg-card"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-muted">
                {member.image ? (
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    sizes="(min-width: 1024px) 24rem, (min-width: 640px) 50vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <Image
                    src="/brand/mark-yellow.png"
                    alt=""
                    width={120}
                    height={120}
                    className="absolute top-1/2 left-1/2 w-24 -translate-x-1/2 -translate-y-1/2 opacity-40"
                  />
                )}
              </div>
              <div className="p-6 text-center">
                <h3 className="display text-base text-foreground">{member.name}</h3>
                <p className="label mt-3 text-primary">
                  <Dashed>{member.role}</Dashed>
                </p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </Band>
  );
}
