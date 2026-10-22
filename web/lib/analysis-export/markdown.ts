// A small Markdown reader for the answers TelaahKarier produces (headings, lists, quotes, bold,
// italic, links, images). The PDF is drawn from its blocks.

export interface Inline {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
  href?: string;
}

export type Block =
  | { type: "heading"; level: 1 | 2 | 3; spans: Inline[] }
  | { type: "paragraph"; spans: Inline[] }
  | { type: "list"; ordered: boolean; items: Inline[][] }
  // One entry per source line, so a quoted posting keeps its line breaks; an empty one is a gap
  | { type: "quote"; lines: Inline[][] }
  | { type: "image"; alt: string; src: string }
  | { type: "code"; text: string }
  | { type: "rule" };

const TOKEN = /\*\*(.+?)\*\*|__(.+?)__|`([^`\n]+)`|\[([^\]\n]+)\]\(([^)\s]+)\)|\*([^*\s][^*\n]*?)\*|_([^_\s][^_\n]*?)_/g;
const IS_WORD = /[\p{L}\p{N}]/u;
const SAFE_LINK = /^(https?:\/\/|mailto:)/i;

export function parseInline(text: string): Inline[] {
  const spans: Inline[] = [];
  let last = 0;

  for (const match of text.matchAll(TOKEN)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    const usesUnderscore = match[2] !== undefined || match[7] !== undefined;

    // snake_case and file_names stay literal: underscores only format at word edges
    if (usesUnderscore && (IS_WORD.test(text[start - 1] ?? "") || IS_WORD.test(text[end] ?? ""))) continue;
    // Only real web or mail links become links
    if (match[4] !== undefined && !SAFE_LINK.test(match[5])) continue;

    if (start > last) spans.push({ text: text.slice(last, start) });

    if (match[1] !== undefined || match[2] !== undefined) {
      spans.push(...parseInline(match[1] ?? match[2]).map((span) => ({ ...span, bold: true })));
    } else if (match[3] !== undefined) {
      spans.push({ text: match[3], code: true });
    } else if (match[4] !== undefined) {
      spans.push(...parseInline(match[4]).map((span) => ({ ...span, href: match[5] })));
    } else {
      spans.push(...parseInline(match[6] ?? match[7]).map((span) => ({ ...span, italic: true })));
    }

    last = end;
  }

  if (last < text.length) spans.push({ text: text.slice(last) });
  return spans;
}

export function plainText(spans: Inline[]): string {
  return spans.map((span) => span.text).join("");
}

const HEADING = /^(#{1,6})\s+(.*?)\s*#*\s*$/;
const RULE = /^\s*([-*_])(\s*\1){2,}\s*$/;
const IMAGE = /^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/;
const QUOTE = /^\s*>\s?(.*)$/;
const LIST_ITEM = /^\s*(?:([-*+•])|(\d+)[.)])\s+(.*)$/;
const FENCE = /^\s*```/;
const TABLE_ROW = /^\s*\|/;

function startsBlock(line: string): boolean {
  return (
    HEADING.test(line) || RULE.test(line) || IMAGE.test(line) || QUOTE.test(line) || LIST_ITEM.test(line) || FENCE.test(line) || TABLE_ROW.test(line)
  );
}

export function parseMarkdown(markdown: string): Block[] {
  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i += 1;
      continue;
    }

    if (FENCE.test(line)) {
      const body: string[] = [];
      i += 1;
      while (i < lines.length && !FENCE.test(lines[i])) body.push(lines[i++]);
      i += 1; // closing fence
      blocks.push({ type: "code", text: body.join("\n") });
      continue;
    }

    if (TABLE_ROW.test(line)) {
      const rows: string[] = [];
      while (i < lines.length && TABLE_ROW.test(lines[i])) rows.push(lines[i++].trim());
      blocks.push({ type: "code", text: rows.join("\n") });
      continue;
    }

    const heading = line.match(HEADING);
    if (heading) {
      blocks.push({ type: "heading", level: Math.min(heading[1].length, 3) as 1 | 2 | 3, spans: parseInline(heading[2]) });
      i += 1;
      continue;
    }

    if (RULE.test(line)) {
      blocks.push({ type: "rule" });
      i += 1;
      continue;
    }

    const image = line.match(IMAGE);
    if (image) {
      blocks.push({ type: "image", alt: image[1], src: image[2] });
      i += 1;
      continue;
    }

    if (QUOTE.test(line)) {
      const quoted: Inline[][] = [];
      while (i < lines.length && QUOTE.test(lines[i])) {
        quoted.push(parseInline((lines[i].match(QUOTE) as RegExpMatchArray)[1]));
        i += 1;
      }
      blocks.push({ type: "quote", lines: quoted });
      continue;
    }

    const firstItem = line.match(LIST_ITEM);
    if (firstItem) {
      const ordered = firstItem[2] !== undefined;
      const items: string[] = [];

      while (i < lines.length) {
        const item = lines[i].match(LIST_ITEM);
        if (item) {
          items.push(item[3]);
        } else if (lines[i].trim() && /^\s{2,}\S/.test(lines[i]) && items.length > 0 && !startsBlock(lines[i])) {
          // A wrapped line of the previous item
          items[items.length - 1] += ` ${lines[i].trim()}`;
        } else {
          break;
        }
        i += 1;
      }

      blocks.push({ type: "list", ordered, items: items.map(parseInline) });
      continue;
    }

    const paragraph: string[] = [];
    while (i < lines.length && lines[i].trim() && (paragraph.length === 0 || !startsBlock(lines[i]))) {
      paragraph.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "paragraph", spans: parseInline(paragraph.join(" ")) });
  }

  return blocks;
}

/** The copy of an export that has no pictures: an image line becomes a note naming the file. */
export function toPlainMarkdown(markdown: string): string {
  return markdown.replace(/^!\[([^\]]*)\]\(attachment:\d+\)[ \t]*$/gm, (_, alt: string) => `[Lampiran: ${alt || "file"}]`);
}
