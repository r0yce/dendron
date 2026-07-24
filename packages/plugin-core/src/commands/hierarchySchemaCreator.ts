/**
 * Pure schema body builder for CreateSchemaFromHierarchy.
 */
import {
  SchemaCreationUtils,
  SchemaInMaking,
  SchemaToken,
} from "@dendronhq/common-all";
import { HierarchyLevel, SchemaCandidate } from "./hierarchySchemaModels";

export function makeHierarchySchemaBody(opts: {
  candidates: readonly SchemaCandidate[];
  hierarchyLevel: HierarchyLevel;
}): string {
  const { candidates, hierarchyLevel } = opts;
  const tokenizedMatrix: SchemaToken[][] = candidates.map((cand) =>
    hierarchyLevel.tokenize(cand.note.fname).map((value) => {
      return { pattern: value };
    })
  );

  const topLevel: SchemaInMaking = {
    id: hierarchyLevel.topId(),
    title: hierarchyLevel.topId(),
    parent: "root",
  } as SchemaInMaking;

  return SchemaCreationUtils.getBodyForTokenizedMatrix({
    topLevel,
    tokenizedMatrix,
  });
}
