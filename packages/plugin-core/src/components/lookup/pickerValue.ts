/**
 * Compose the lookup QuickPick value from prefix + modifiers.
 * Pure (no VS Code) — only reads picker field strings.
 */
import _ from "lodash";

export type PickerValueParts = {
  prefix?: string | undefined;
  noteModifierValue?: string | undefined;
  selectionModifierValue?: string | undefined;
};

/**
 * Join non-empty picker value parts with `.`
 * (prefix · note type modifier · selection modifier).
 */
export function getPickerValue(picker: PickerValueParts): string {
  return [picker.prefix, picker.noteModifierValue, picker.selectionModifierValue]
    .filter((ent) => !_.isEmpty(ent))
    .join(".");
}
