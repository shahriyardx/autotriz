/** Strips Markdown down to plain text, for meta descriptions, JSON-LD
 *  and the short teaser on a product page. */
export function markdownToText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/^\s{0,3}>\s?/gm, "")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/^\s{0,3}([-*_]\s*){3,}$/gm, " ")
    // Table separator rows, then the remaining cell pipes.
    .replace(/^\s*\|?[\s:|-]*\|[\s:|-]*$/gm, " ")
    .replace(/^\s*\|(.+)\|\s*$/gm, "$1")
    .replace(/\s*\|\s*/g, " · ")
    .replace(/^\s{0,3}[-*+]\s+/gm, "")
    .replace(/^\s{0,3}\d+\.\s+/gm, "")
    .replace(/(\*\*|__|\*|_|`|~~)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const truncate = (text: string, length: number) =>
  text.length > length ? `${text.slice(0, length).trimEnd()}…` : text;
