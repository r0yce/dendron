/**
 * Map dendron.yml lookup.note.selectionMode → LookupSelectionType string.
 * Pure — no VS Code.
 */
export function selectionModeConfigToType(
  selectionMode: string | undefined
): "selection2link" | "none" | "selectionExtract" {
  switch (selectionMode) {
    case "link":
      return "selection2link";
    case "none":
      return "none";
    case "extract":
    default:
      return "selectionExtract";
  }
}
