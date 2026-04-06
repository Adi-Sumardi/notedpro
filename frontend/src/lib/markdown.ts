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

  // Bold + italic, bold, italic, inline code, links
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g,     "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g,          "<em>$1</em>");
  html = html.replace(/`(.+?)`/g,            "<code>$1</code>");
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  // Blockquotes
  html = html.replace(/^> (.+)$/gm, "<blockquote><p>$1</p></blockquote>");

  // Unordered lists
  html = html.replace(/((?:^[-*+] .+(?:\n|$))+)/gm, (match) => {
    const items = match.trim().split("\n")
      .map((l) => `<li>${l.replace(/^[-*+] /, "")}</li>`)
      .join("");
    return `<ul>${items}</ul>`;
  });

  // Ordered lists
  html = html.replace(/((?:^\d+\. .+(?:\n|$))+)/gm, (match) => {
    const items = match.trim().split("\n")
      .map((l) => `<li>${l.replace(/^\d+\. /, "")}</li>`)
      .join("");
    return `<ol>${items}</ol>`;
  });

  // Paragraphs — wrap bare text blocks not already wrapped in a block tag
  const blocks = html.split(/\n{2,}/);
  html = blocks.map((block) => {
    const b = block.trim();
    if (!b) return "";
    if (/^<(h[1-6]|ul|ol|blockquote|pre|hr|%%CODE)/.test(b)) return b;
    return `<p>${b.replace(/\n/g, "<br>")}</p>`;
  }).filter(Boolean).join("\n");

  // Restore code blocks
  codeBlocks.forEach((code, i) => {
    html = html.replace(`%%CODEBLOCK_${i}%%`, code);
  });

  return html;
}

function escHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
