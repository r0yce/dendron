import abbrPlugin from "remark-abbr";
import type { Plugin } from "unified";

/**
 * remark-abbr@1.x expects the legacy remark-parse API (`this.Parser.prototype`).
 * Modern remark-parse (micromark) no longer exposes Parser, so the stock plugin
 * throws: Cannot read properties of undefined (reading 'prototype').
 *
 * When Parser is missing, skip abbr handling (no-op). Abbreviation syntax is
 * rare in Dendron notes; parse/fold/code-actions must not crash without it.
 */
export const safeAbbrPlugin: Plugin = function safeAbbrPlugin(
  this: unknown,
  options?: unknown
) {
  const self = this as { Parser?: { prototype?: unknown } };
  if (!self?.Parser?.prototype) {
    return undefined;
  }
  return (abbrPlugin as unknown as (this: unknown, opts?: unknown) => unknown).call(
    this,
    options
  ) as undefined;
};

export default safeAbbrPlugin;
