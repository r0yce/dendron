/**
 * HTML escaping for inline webview HTML (Task Board, Hub Home, etc.).
 * Prefer this over copy-pasting replace chains in each view.
 */

/** Escape text for HTML body content. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Escape for double-quoted HTML attributes. */
export function escapeAttr(s: string): string {
  return escapeHtml(s).replace(/'/g, "&#39;");
}
