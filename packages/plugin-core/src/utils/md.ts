/**
 * Markdown / wiki-link reference helpers used by language features and lookup.
 *
 * Implementation: `./md/_impl.ts` (split further when touching one area heavily).
 * Prefer importing from `utils/md` (this facade) for stable paths.
 *
 * Frontmatter line helpers are **1-indexed** — check callers before changing.
 */
export * from "./md/_impl";
