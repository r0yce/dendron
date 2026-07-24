import { NoteProps } from "@dendronhq/common-all";
import stringSimilarity from "string-similarity";

/**
 * Sort candidate notes by fname similarity to the query (best match first).
 * Used when ranking lookup results after Fuse.
 */
export function sortBySimilarity(candidates: NoteProps[], query: string) {
  return (
    candidates
      .map((cand) => ({
        cand,
        similarityScore: stringSimilarity.compareTwoStrings(cand.fname, query),
      }))
      .sort((a, b) => b.similarityScore - a.similarityScore)
      .map((v) => v.cand)
  );
}
