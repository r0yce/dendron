/**
 * Pure helpers for inbox/task extraction from note markdown bodies.
 * Unit-testable without VS Code — keep ritual commands thin by calling these.
 *
 * Consumers: ExtractTasks, ProcessInbox (partial), WorkspaceHealth, Local AI offline,
 * Hub Home inbox counts.
 */

/** Open list bullets (not completed checkboxes), as plain text strings. */
export function extractOpenBullets(body: string, limit = 25): string[] {
  return (body || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(
      (l) =>
        (l.startsWith("- ") || l.startsWith("* ")) &&
        !l.includes("[x]") &&
        !l.includes("[X]")
    )
    .map((l) => l.replace(/^[-*]\s+(\[[ xX]\]\s*)?/, "").trim())
    .filter((t) => t.length > 2)
    .slice(0, limit);
}

/** Count open inbox-style bullets (for dashboards; no text extraction). */
export function countOpenInboxBullets(body: string): number {
  return (body || "")
    .split("\n")
    .filter(
      (l) =>
        l.trim().startsWith("- ") &&
        !l.includes("[x]") &&
        !l.includes("[X]")
    ).length;
}

/**
 * Structured open bullets with line index (for Process Inbox triage).
 * Strips optional Capture timestamps like `2026-07-24 12:00 — `.
 */
export type OpenBulletLine = { lineIdx: number; text: string; raw: string };

export function parseOpenBulletLines(body: string): OpenBulletLine[] {
  const lines = (body || "").split("\n");
  const out: OpenBulletLine[] = [];
  lines.forEach((raw, lineIdx) => {
    const m = raw.match(/^- (?:\[ \] )?(.+)$/);
    if (!m) return;
    if (raw.includes("[x]") || raw.includes("[X]")) return;
    const text = m[1]!
      .replace(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2} — /, "")
      .trim();
    if (!text || text.startsWith("#")) return;
    out.push({ lineIdx, text, raw });
  });
  return out;
}

/** Mark given raw bullet lines as completed checkboxes. */
export function markBulletsProcessedInBody(
  body: string,
  doneRawLines: string[]
): string {
  const doneTexts = new Set(doneRawLines);
  return (body || "")
    .split("\n")
    .map((line) => {
      if (!doneTexts.has(line)) return line;
      if (line.includes("[x]") || line.includes("[X]")) return line;
      if (line.startsWith("- [ ] ")) return line.replace("- [ ] ", "- [x] ");
      if (line.startsWith("- ")) return line.replace("- ", "- [x] ");
      return line;
    })
    .join("\n");
}

/** Slug suitable for Dendron fname segment. */
export function slugifyTaskTitle(text: string, maxLen = 48): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, maxLen);
}

/** Parse OpenAI-compatible / Ollama chat completion JSON shapes. */
export function parseChatCompletionResponse(json: unknown): string {
  const j = json as any;
  const text =
    j?.choices?.[0]?.message?.content ||
    j?.message?.content ||
    j?.response ||
    (typeof json === "string" ? json : JSON.stringify(json, null, 2));
  return String(text);
}

/** Deterministic offline scaffold when no local model endpoint is set. */
export function offlineAIScaffold(opts: {
  prompt: string;
  noteFname: string;
  bodyPreview: string;
}): string {
  const lines = opts.bodyPreview
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const headings = lines.filter((l) => l.startsWith("#")).slice(0, 12);
  const bullets = lines
    .filter((l) => l.startsWith("- ") || l.startsWith("* "))
    .slice(0, 12);

  return [
    `## Offline scaffold (no model endpoint configured)`,
    ``,
    `This is a **local structure assist**, not a model completion.`,
    `Set \`dendron.localAI.endpoint\` to a local OpenAI-compatible URL (e.g. Ollama at http://127.0.0.1:11434/v1/chat/completions).`,
    ``,
    `### Your prompt`,
    opts.prompt,
    ``,
    `### Note structure`,
    headings.length
      ? headings.map((h) => `- ${h}`).join("\n")
      : `- (no headings found in first ${opts.bodyPreview.length} chars)`,
    ``,
    `### Candidate bullets`,
    bullets.length
      ? bullets.map((b) => `- ${b.replace(/^[-*]\s+/, "")}`).join("\n")
      : `- (no list items found)`,
    ``,
    `### Suggested next steps`,
    `- [ ] Refine the note title / hierarchy under \`${opts.noteFname}\``,
    `- [ ] Promote any capture bullets into task notes`,
    `- [ ] Link related concepts with wiki-links`,
    ``,
  ].join("\n");
}
