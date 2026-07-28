// ─── Tiptap JSON → Markdown ───────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function tiptapToMarkdown(json: any): string {
  if (!json || !json.content) return "";
  return json.content.map(nodeToMd).filter(Boolean).join("\n\n");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function nodeToMd(node: any): string {
  if (!node) return "";

  switch (node.type) {
    case "paragraph":
      return inlinesToMd(node.content);

    case "heading": {
      const level = node.attrs?.level ?? 1;
      return `${"#".repeat(level)} ${inlinesToMd(node.content)}`;
    }

    case "bulletList":
      return (node.content ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any) => `- ${inlinesToMd(item.content?.[0]?.content)}`)
        .join("\n");

    case "orderedList":
      return (node.content ?? [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((item: any, i: number) => `${i + 1}. ${inlinesToMd(item.content?.[0]?.content)}`)
        .join("\n");

    case "blockquote":
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (node.content ?? []).map((n: any) => `> ${nodeToMd(n)}`).join("\n");

    case "codeBlock": {
      const lang = node.attrs?.language ?? "";
      const code = node.content?.[0]?.text ?? "";
      return `\`\`\`${lang}\n${code}\n\`\`\``;
    }

    case "horizontalRule":
      return "---";

    default:
      return (node.content ?? []).map(nodeToMd).join("\n\n");
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function inlinesToMd(nodes: any[] | undefined): string {
  if (!nodes) return "";
  return nodes.map(inlineToMd).join("");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function inlineToMd(node: any): string {
  if (!node) return "";
  if (node.type === "hardBreak") return "  \n";

  let text: string = node.text ?? "";

  if (node.marks?.length) {
    const hasCode  = node.marks.some((m: { type: string }) => m.type === "code");
    const hasBold  = node.marks.some((m: { type: string }) => m.type === "bold");
    const hasItalic = node.marks.some((m: { type: string }) => m.type === "italic");
    const linkMark = node.marks.find((m: { type: string }) => m.type === "link");

    if (hasCode)   return `\`${text}\``;
    if (linkMark)  text = `[${text}](${linkMark.attrs?.href ?? ""})`;
    if (hasBold && hasItalic) return `***${text}***`;
    if (hasBold)   return `**${text}**`;
    if (hasItalic) return `*${text}*`;
  }

  return text;
}

// ─── Markdown → HTML (for Tiptap setContent) ─────────────────────────────────

export function markdownToHtml(md: string): string {
  let html = md;

  // Fenced code blocks — process first to protect content
  const codeBlocks: string[] = [];
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const placeholder = `%%CODEBLOCK_${codeBlocks.length}%%`;
    codeBlocks.push(`<pre><code>${escHtml(code.trim())}</code></pre>`);
    return placeholder;
  });

  // Headings
  html = html.replace(/^###### (.+)$/gm, "<h6>$1</h6>");
  html = html.replace(/^##### (.+)$/gm,  "<h5>$1</h5>");
  html = html.replace(/^#### (.+)$/gm,   "<h4>$1</h4>");
  html = html.replace(/^### (.+)$/gm,    "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm,     "<h2>$1</h2>");
  html = html.replace(/^# (.+)$/gm,      "<h1>$1</h1>");

  // Horizontal rule
  html = html.replace(/^---+$/gm, "<hr>");

  // Tables (GFM pipe tables) — process before bold/italic/link so cell
  // formatting still runs on the extracted cell text further down.
  const tables: string[] = [];
  html = html.replace(
    /^(\|.*\|)\n\|(?:\s*:?-+:?\s*\|)+\n((?:\|.*\|\n?)+)/gm,
    (_, headerLine: string, bodyLines: string) => {
      const splitRow = (line: string) =>
        line
          .trim()
          .replace(/^\||\|$/g, "")
          .split("|")
          .map((c) => c.trim());

      const headerCells = splitRow(headerLine)
        .map((c) => `<th>${c}</th>`)
        .join("");
      const rows = bodyLines
        .trim()
        .split("\n")
        .map((line) => {
          const cells = splitRow(line).map((c) => `<td>${c}</td>`).join("");
          return `<tr>${cells}</tr>`;
        })
        .join("");

      const placeholder = `%%TABLE_${tables.length}%%`;
      tables.push(`<table><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table>`);
      return placeholder;
    }
  );

  // Bold + italic, bold, italic, inline code
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g,     "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g,          "<em>$1</em>");
  html = html.replace(/`(.+?)`/g,            "<code>$1</code>");

  // Images — must run before the generic link regex, otherwise
  // ![alt](src) gets mistaken for a link and produces a broken <a> tag,
  // silently dropping the image reference on import.
  html = html.replace(/!\[(.*?)\]\((.+?)\)/g, '<img src="$2" alt="$1">');
  // Links
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>");

  // Unordered lists — leading indentation is allowed (but not preserved as
  // nesting) so indented/nested Notion sub-bullets are kept as list items
  // instead of falling through to the paragraph step and losing their
  // list structure entirely.
  html = html.replace(/((?:^[ \t]*[-*+] .+(?:\n|$))+)/gm, (match) => {
    const items = match.trim().split("\n")
      .map((l) => `<li>${l.replace(/^[ \t]*[-*+] /, "")}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/((?:^[ \t]*\d+\. .+(?:\n|$))+)/gm, (match) => {
    const items = match.trim().split("\n")
      .map((l) => `<li>${l.replace(/^[ \t]*\d+\. /, "")}</li>`)
      .join("");
    return `<ol>${items}</ol>`;
  });

  // Paragraphs — wrap bare text blocks not already wrapped in a block tag
  const blocks = html.split(/\n{2,}/);
  html = blocks.map((block) => {
    const b = block.trim();
    if (!b) return "";
    if (/^<(h[1-6]|ul|ol|blockquote|pre|hr|%%CODE|%%TABLE)/.test(b)) return b;
    return `<p>${b.replace(/\n/g, "<br>")}</p>`;
  }).filter(Boolean).join("\n");

  // Restore tables
  tables.forEach((table, i) => {
    html = html.replace(`%%TABLE_${i}%%`, table);
  });

  // Restore code blocks
  codeBlocks.forEach((code, i) => {
    html = html.replace(`%%CODEBLOCK_${i}%%`, code);
  });

  return html;
}

/**
 * Local image paths referenced by `![alt](src)` in a Notion markdown export
 * (excludes already-absolute http(s)/data URIs). Used to match against files
 * the user picks alongside the .md so they can be uploaded and the src
 * rewritten to a real URL — otherwise the <img> tag from markdownToHtml
 * points at a path that only ever existed on the exporter's disk.
 */
export function extractLocalImageRefs(md: string): string[] {
  const refs = new Set<string>();
  const re = /!\[.*?\]\((.+?)\)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(md))) {
    const src = match[1].trim();
    if (!/^(https?:)?\/\//i.test(src) && !/^data:/i.test(src)) {
      refs.add(src);
    }
  }
  return Array.from(refs);
}

/**
 * Notion's plain-text markdown export of a database row lists its properties
 * as "Property Name: value" lines near the top of the file (e.g.
 * "Event time: July 21, 2026 10:00 AM"). Best-effort extraction so the
 * meeting date/time can be pre-filled instead of typed in manually — falls
 * back to null (leaving the field for the user) if nothing parseable is found.
 */
export function extractMeetingDateTime(md: string): string | null {
  const match = md.match(/^(?:Event time|Meeting Date|Date|Tanggal|Waktu)\s*:\s*(.+)$/im);
  if (!match) return null;

  const raw = match[1].split("→")[0].trim();
  const parsed = new Date(raw);
  if (isNaN(parsed.getTime())) return null;

  const pad = (n: number) => String(n).padStart(2, "0");
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}T${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`;
}

/** Replace `src="<ref>"` occurrences in already-converted HTML with resolved URLs. */
export function rewriteImageSrcs(html: string, srcMap: Record<string, string>): string {
  let out = html;
  for (const [ref, url] of Object.entries(srcMap)) {
    const escaped = ref.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`src="${escaped}"`, "g"), `src="${url}"`);
  }
  return out;
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
