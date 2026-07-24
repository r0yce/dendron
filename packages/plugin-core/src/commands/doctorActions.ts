/**
 * Doctor action enums and workspace-reload policy (pure).
 */
import { DoctorActionsEnum } from "@dendronhq/engine-server";

export enum PluginDoctorActionsEnum {
  FIND_INCOMPATIBLE_EXTENSIONS = "findIncompatibleExtensions",
  FIX_KEYBINDING_CONFLICTS = "fixKeybindingConflicts",
}

export type DoctorAction = DoctorActionsEnum | PluginDoctorActionsEnum;

/** Only reload the workspace for these commands before running. */
export const RELOAD_BEFORE_ACTIONS: DoctorAction[] = [
  DoctorActionsEnum.FIX_FRONTMATTER,
  DoctorActionsEnum.CREATE_MISSING_LINKED_NOTES,
];

export const RELOAD_AFTER_ACTIONS: DoctorAction[] = [
  DoctorActionsEnum.FIX_FRONTMATTER,
  DoctorActionsEnum.CREATE_MISSING_LINKED_NOTES,
];

export function shouldDoctorReloadWorkspaceBeforeDoctorAction(
  action: DoctorAction
): boolean {
  return RELOAD_BEFORE_ACTIONS.includes(action);
}

export function shouldDoctorReloadWorkspaceAfterDoctorAction(
  action: DoctorAction
): boolean {
  return RELOAD_AFTER_ACTIONS.includes(action);
}
