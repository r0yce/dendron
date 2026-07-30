/**
 * Pure quick-pick item builders for Pod UI (no vscode).
 * Node-smokeable.
 */
import {
  CopyAsFormat,
  getAllCopyAsFormat,
  PodExportScope,
  PodV2Types,
} from "@dendronhq/pods-core";
import {
  getDescriptionForPodType,
  getDescriptionForScope,
} from "./podControlDescriptions";

export type PlainQuickPickItem = {
  label: string;
  detail?: string;
  description?: string;
};

/** Items for export-scope quick pick. */
export function buildExportScopeQuickPickItems(): PlainQuickPickItem[] {
  return Object.keys(PodExportScope)
    .filter((key) => Number.isNaN(Number(key)))
    .map((value) => ({
      label: value,
      detail: getDescriptionForScope(value as PodExportScope),
    }));
}

/** Items for pod-type quick pick. */
export function buildPodTypeQuickPickItems(): PlainQuickPickItem[] {
  return Object.keys(PodV2Types)
    .filter((key) => Number.isNaN(Number(key)))
    .map((value) => ({
      label: value,
      detail: getDescriptionForPodType(value as PodV2Types),
    }));
}

/** Destination chooser for single-note export. */
export function buildDestinationQuickPickItems(): PlainQuickPickItem[] {
  return [
    {
      label: "clipboard",
      detail: "Puts the contents of the export into your clipboard",
    },
    {
      label: "local filesystem",
      detail: "Exports the contents to a local directory",
    },
  ];
}

/** Whether clipboard destination is allowed for a given export scope. */
export function destinationAllowsClipboard(exportScope: PodExportScope): boolean {
  return (
    exportScope === PodExportScope.Note ||
    exportScope === PodExportScope.Selection
  );
}

/** Copy-as format labels (detail text only; keybindings filled by shell). */
export function buildCopyAsFormatBaseItems(): Array<{
  label: CopyAsFormat;
  detail: string;
}> {
  return getAllCopyAsFormat().map((value) => ({
    label: value,
    detail: `Format Dendron note to ${value} and copy it to the clipboard`,
  }));
}

/** Yes/No save-as-new-config chooser items. */
export function buildSaveAsNewConfigItems(): PlainQuickPickItem[] {
  return [
    {
      label: "Yes",
      detail:
        "Select this option if you anticipate running this pod multiple-times",
    },
    {
      label: "No",
      detail: "Run this pod now",
    },
  ];
}
