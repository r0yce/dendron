/**
 * Shared types for markdown reference helpers.
 */
import { DNoteAnchorBasic, NotePropsMeta } from "@dendronhq/common-all";
import { Location } from "vscode";

export type RefT = {
  label: string;
  /** If undefined, then the file this reference is located in is the ref */
  ref?: string | undefined;
  anchorStart?: DNoteAnchorBasic | undefined;
  anchorEnd?: DNoteAnchorBasic | undefined;
  vaultName?: string | undefined;
};

export type FoundRefT = {
  location: Location;
  matchText: string;
  isCandidate?: boolean | undefined;
  isFrontmatterTag?: boolean | undefined;
  note: NotePropsMeta;
};

