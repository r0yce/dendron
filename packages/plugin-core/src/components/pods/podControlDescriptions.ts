/**
 * Pure Pod UI copy — scope / type descriptions (no vscode).
 */
import { assertUnreachable } from "@dendronhq/common-all";
import { PodExportScope, PodV2Types } from "@dendronhq/pods-core";

/** Small helper: descriptions for export-scope quick pick. */
export function getDescriptionForScope(scope: PodExportScope): string {
  switch (scope) {
    case PodExportScope.Lookup:
      return "Prompts user to select note(s) for export";

    case PodExportScope.LinksInSelection:
      return "Exports all notes in wikilinks of current selected portion of text in the open note editor";

    case PodExportScope.Note:
      return "Exports the currently opened note";

    case PodExportScope.Hierarchy:
      return "Exports all notes that fall under a hierarchy";

    case PodExportScope.Vault:
      return "Exports all notes within a vault";

    case PodExportScope.Workspace:
      return "Exports all notes in the Dendron workspace";

    case PodExportScope.Selection:
      return "Export the selected text from currently opened note";

    default:
      assertUnreachable(scope);
  }
}

/** Small helper: descriptions for pod-type quick pick. */
export function getDescriptionForPodType(type: PodV2Types): string {
  switch (type) {
    case PodV2Types.MarkdownExportV2:
      return "Formats Dendron markdown and exports it to the clipboard or local file system";

    case PodV2Types.GoogleDocsExportV2:
      return "Formats Dendron note to google doc";

    case PodV2Types.NotionExportV2:
      return "Exports notes to Notion";
    case PodV2Types.JSONExportV2:
      return "Formats notes to JSON and exports it to clipboard or local file system";

    default:
      assertUnreachable(type);
  }
}
