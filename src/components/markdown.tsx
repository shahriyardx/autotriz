import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/cn";

/* Renders stored Markdown. `react-markdown` does not evaluate raw HTML,
   so nothing an admin pastes can inject markup into the page. */

export function Markdown({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  if (!children?.trim()) return null;

  return (
    <div className={cn("leading-relaxed text-foreground/75", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children: c }) => <h2 className="display mt-8 text-xl first:mt-0">{c}</h2>,
          h2: ({ children: c }) => <h2 className="display mt-8 text-lg first:mt-0">{c}</h2>,
          h3: ({ children: c }) => <h3 className="display-tight mt-6 text-base first:mt-0">{c}</h3>,
          h4: ({ children: c }) => <h4 className="display-tight mt-5 text-sm first:mt-0">{c}</h4>,
          p: ({ children: c }) => <p className="mt-4 first:mt-0">{c}</p>,
          strong: ({ children: c }) => <strong className="font-semibold text-foreground">{c}</strong>,
          ul: ({ children: c }) => <ul className="mt-4 space-y-2.5 first:mt-0">{c}</ul>,
          ol: ({ children: c }) => <ol className="mt-4 list-decimal space-y-2.5 pl-5 first:mt-0">{c}</ol>,
          li: ({ children: c, ...props }) =>
            "ordered" in props && props.ordered ? (
              <li className="pl-1">{c}</li>
            ) : (
              <li className="flex items-start gap-3">
                <span aria-hidden className="mt-2.5 h-1 w-3 shrink-0 bg-primary" />
                <span className="min-w-0 flex-1">{c}</span>
              </li>
            ),
          a: ({ href, children: c }) => (
            <a
              href={href}
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noreferrer" : undefined}
              className="text-foreground underline decoration-primary underline-offset-4 transition-colors hover:text-primary"
            >
              {c}
            </a>
          ),
          blockquote: ({ children: c }) => (
            <blockquote className="mt-5 border-l-2 border-primary pl-5 text-foreground/60">{c}</blockquote>
          ),
          code: ({ children: c }) => (
            <code className="rounded bg-muted px-1.5 py-0.5 text-[0.9em]">{c}</code>
          ),
          pre: ({ children: c }) => (
            <pre className="mt-5 overflow-x-auto rounded-md bg-muted p-4 text-sm">{c}</pre>
          ),
          hr: () => <hr className="my-8 border-border" />,
          img: ({ src, alt }) =>
            typeof src === "string" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={alt ?? ""} loading="lazy" className="mt-5 w-full rounded-md" />
            ) : null,
          table: ({ children: c }) => (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full border-collapse text-sm">{c}</table>
            </div>
          ),
          th: ({ children: c }) => (
            <th className="border-b border-border px-3 py-2 text-left font-semibold text-foreground">{c}</th>
          ),
          td: ({ children: c }) => <td className="border-b border-border px-3 py-2">{c}</td>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
