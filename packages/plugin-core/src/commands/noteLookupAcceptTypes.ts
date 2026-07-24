/**
 * Shared return type for note lookup accept paths.
 */
import { NoteProps } from "@dendronhq/common-all";
import { Uri } from "vscode";

export type NoteLookupAcceptReturn = {
  uri: Uri;
  node: NoteProps;
  resp?: any;
};
