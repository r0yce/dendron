/**
 * Pure install-status gates (no vscode). Node-smokeable.
 */
import { CONSTANTS, InstallStatus } from "@dendronhq/common-all";
import _ from "lodash";

/** Check if we upgraded, initialized for the first time or no change was detected. */
export function getInstallStatusForWorkspace({
  previousWorkspaceVersion,
  currentVersion,
}: {
  previousWorkspaceVersion?: string;
  currentVersion: string;
}): InstallStatus {
  if (
    _.isUndefined(previousWorkspaceVersion) ||
    previousWorkspaceVersion === CONSTANTS.DENDRON_INIT_VERSION
  ) {
    return InstallStatus.INITIAL_INSTALL;
  }
  if (previousWorkspaceVersion !== currentVersion) {
    return InstallStatus.UPGRADED;
  }
  return InstallStatus.NO_CHANGE;
}

/** Get install status for the extension (global version). */
export function getInstallStatusForExtension({
  previousGlobalVersion,
  currentVersion,
}: {
  previousGlobalVersion?: string;
  currentVersion: string;
}): InstallStatus {
  // if there is no global version set, then its a new install
  if (
    _.isUndefined(previousGlobalVersion) ||
    previousGlobalVersion === CONSTANTS.DENDRON_INIT_VERSION
  ) {
    return InstallStatus.INITIAL_INSTALL;
  }
  if (previousGlobalVersion !== currentVersion) {
    return InstallStatus.UPGRADED;
  }
  return InstallStatus.NO_CHANGE;
}
