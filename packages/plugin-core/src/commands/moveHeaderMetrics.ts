/**
 * Analytics payload for MoveHeaderCommand.
 */
import {
  DNodeUtils,
  DNoteHeaderAnchor,
  NoteChangeEntry,
  NoteProps,
  extractNoteChangeEntryCounts,
} from "@dendronhq/common-all";
import { Heading, Node } from "@dendronhq/engine-server";
import _ from "lodash";
import { ExtensionProvider } from "../ExtensionProvider";
import { ProxyMetricUtils } from "../utils/ProxyMetricUtils";

export function trackMoveHeaderProxyMetrics(opts: {
  commandKey: string;
  origin: NoteProps;
  nodesToMove: Node[];
  changed: NoteChangeEntry[];
}): {
  createdCount: number;
  deletedCount: number;
  updatedCount: number;
} {
  const noteChangeEntryCounts =
    opts.changed !== undefined
      ? { ...extractNoteChangeEntryCounts(opts.changed) }
      : {
          createdCount: 0,
          updatedCount: 0,
          deletedCount: 0,
        };

  const engine = ExtensionProvider.getEngine();
  const { vaults } = engine;
  const { origin } = opts;

  const headers = _.toArray(origin.anchors).filter((anchor) => {
    return anchor !== undefined && anchor.type === "header";
  }) as DNoteHeaderAnchor[];

  const numOriginHeaders = headers.length;
  const originHeaderDepths = headers.map((header) => header.depth);
  const maxOriginHeaderDepth = _.max(originHeaderDepths);
  const meanOriginHeaderDepth = _.mean(originHeaderDepths);
  const movedHeaders = opts.nodesToMove.filter((node) => {
    return node.type === "heading";
  }) as Heading[];
  const numMovedHeaders = movedHeaders.length;
  const movedHeaderDepths = movedHeaders.map((header) => header.depth);
  const maxMovedHeaderDepth = _.max(movedHeaderDepths);
  const meanMovedHeaderDepth = _.mean(movedHeaderDepths);

  ProxyMetricUtils.trackRefactoringProxyMetric({
    props: {
      command: opts.commandKey,
      numVaults: vaults.length,
      traits: origin.traits || [],
      numChildren: origin.children.length,
      numLinks: origin.links.length,
      numChars: origin.body.length,
      noteDepth: DNodeUtils.getDepth(origin),
    },
    extra: {
      ...noteChangeEntryCounts,
      numOriginHeaders,
      maxOriginHeaderDepth,
      meanOriginHeaderDepth,
      numMovedHeaders,
      maxMovedHeaderDepth,
      meanMovedHeaderDepth,
    },
  });

  return noteChangeEntryCounts;
}
