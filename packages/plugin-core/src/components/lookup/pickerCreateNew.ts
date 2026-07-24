import { FuseEngine } from "@dendronhq/common-all";
import _ from "lodash";

/**
 * Lookup "Create New" ranking contract.
 *
 * When Create New is shown, decide whether it should bubble to the **top** of
 * results. We suppress bubble-up when:
 * - there is already an exact fname match (user usually wants that note), or
 * - the query has Fuse special characters / spaces (ambiguous create intent).
 *
 * Callers still decide *whether* Create New appears; this only ranks it.
 */
export function shouldBubbleUpCreateNew({
  numberOfExactMatches,
  querystring,
  bubbleUpCreateNew,
}: {
  numberOfExactMatches: number;
  querystring: string;
  bubbleUpCreateNew?: boolean;
}) {
  const noExactMatches = numberOfExactMatches === 0;
  const noSpecialQueryChars =
    !FuseEngine.doesContainSpecialQueryChars(querystring);

  if (_.isUndefined(bubbleUpCreateNew)) bubbleUpCreateNew = true;

  return noSpecialQueryChars && noExactMatches && bubbleUpCreateNew;
}
