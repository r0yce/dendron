import type { DendronError } from "@dendronhq/common-all";
import type { ProcDataFullV5, ProcOptsV5 } from "./utilsv5";

declare module "unified" {
  interface Data {
    dendronProcOptsv5?: ProcOptsV5;
    dendronProcDatav5?: Partial<ProcDataFullV5> & Record<string, unknown>;
    errors?: DendronError[];
    fm?: Record<string, unknown>;
  }
}

declare module "unist" {
  interface Data {
    hProperties?: Record<string, unknown>;
    // Allow Dendron AST and mdast node payloads (TS 6+ strict Data overlap checks).
    [key: string]: unknown;
  }
}

export {};