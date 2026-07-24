/**
 * Lookup QuickPick filter helpers and create-new detection.
 * Extracted from PickerUtilsV2 for maintainability.
 */
import {
  DNodePropsQuickInputV2,
  DNodeUtils,
} from "@dendronhq/common-all";
import _ from "lodash";
import {
  CREATE_NEW_DETAIL_LIST,
  CREATE_NEW_LABEL,
  CREATE_NEW_NOTE_WITH_TEMPLATE_DETAIL,
  MORE_RESULTS_LABEL,
} from "./constants";

export function filterCreateNewItem(
  items: DNodePropsQuickInputV2[]
): DNodePropsQuickInputV2[] {
  return _.reject(items, { label: CREATE_NEW_LABEL });
}

export function filterDefaultItems(
  items: DNodePropsQuickInputV2[]
): DNodePropsQuickInputV2[] {
  return _.reject(
    items,
    (ent) =>
      ent.label === CREATE_NEW_LABEL || ent.label === MORE_RESULTS_LABEL
  );
}

/** Reject all items deeper than `depth` hierarchy levels. */
export function filterByDepth(
  items: DNodePropsQuickInputV2[],
  depth: number
): DNodePropsQuickInputV2[] {
  return _.reject(items, (ent) => {
    return DNodeUtils.getDepth(ent) > depth;
  });
}

/** Keep only non-stub items. */
export function filterNonStubs(
  items: DNodePropsQuickInputV2[]
): DNodePropsQuickInputV2[] {
  return _.filter(items, (ent) => {
    return !ent.stub;
  });
}

export function getCreateNewItem(
  items: readonly DNodePropsQuickInputV2[]
): DNodePropsQuickInputV2 | undefined {
  return _.find(items, { label: CREATE_NEW_LABEL });
}

export function isCreateNewNotePickedForSingle(
  node: DNodePropsQuickInputV2
): boolean {
  if (!node) {
    return true;
  }
  if (
    CREATE_NEW_DETAIL_LIST.includes(node.detail || "") ||
    node.stub ||
    node.schemaStub
  ) {
    return true;
  }
  return false;
}

export function isCreateNewNotePicked(node: DNodePropsQuickInputV2): boolean {
  if (!node) {
    return true;
  }
  if (
    CREATE_NEW_DETAIL_LIST.includes(node.detail || "") ||
    node.stub ||
    node.schemaStub
  ) {
    return true;
  }
  return false;
}

export function isCreateNewNoteWithTemplatePicked(
  node: DNodePropsQuickInputV2
): boolean {
  return (
    isCreateNewNotePicked(node) &&
    node.detail === CREATE_NEW_NOTE_WITH_TEMPLATE_DETAIL
  );
}

export function isInputEmpty(value?: string): value is undefined {
  if (_.isUndefined(value)) {
    return true;
  }
  if (_.isEmpty(value)) {
    return true;
  }
  return false;
}

export function getQueryUpToLastDot(query: string): string {
  return query.lastIndexOf(".") >= 0
    ? query.slice(0, query.lastIndexOf("."))
    : "";
}
