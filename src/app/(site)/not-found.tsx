import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <section className="relative overflow-hidden bg-background py-32 md:py-40">
      
      <div className="shell relative">
        <p className="label text-muted-foreground">Error 404</p>
        <h1 className="display mt-6 text-[clamp(2.25rem,6vw,4.5rem)]">
          No such
          <br />
          <span className="accent">surface</span>
        </h1>
        <p className="lede mt-10 max-w-lg">
          That page is not here. It may have moved when the site was rebuilt.
        </p>
        <div className="mt-12 flex flex-wrap gap-4">
          <Button href="/">Back to the front</Button>
          <Button href="/automotive-ceramic-coating" variant="outline">
            Browse the range
          </Button>
        </div>
      </div>
    </section>
  );
}
