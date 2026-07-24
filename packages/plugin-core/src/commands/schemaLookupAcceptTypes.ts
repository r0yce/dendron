/**
 * Shared return type for schema lookup accept paths.
 */
import { SchemaModuleProps } from "@dendronhq/common-all";
import { Uri } from "vscode";

export type SchemaLookupAcceptReturn = {
  uri: Uri;
  node: SchemaModuleProps;
  resp?: any;
};
