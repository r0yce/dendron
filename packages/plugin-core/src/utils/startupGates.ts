/**
 * Pure / config-only startup decision gates (no vscode UI).
 * Node-smokeable where inputs are plain data.
 */
import {
  ConfigUtils,
  DendronConfig,
  InstallStatus,
} from "@dendronhq/common-all";
import {
  DEPRECATED_PATHS,
  InactvieUserMsgStatusEnum,
} from "@dendronhq/engine-server";
import { Duration } from "luxon";
import semver from "semver";

export function shouldShowManualUpgradeMessage(opts: {
  previousWorkspaceVersion: string;
  workspaceInstallStatus: InstallStatus;
}): boolean {
  const { previousWorkspaceVersion, workspaceInstallStatus } = opts;
  return (
    workspaceInstallStatus === InstallStatus.UPGRADED &&
    semver.lte(previousWorkspaceVersion, "0.63.0")
  );
}

export function shouldDisplayDeprecatedConfigMessage(opts: {
  extensionInstallStatus: InstallStatus;
  rawConfig: Partial<DendronConfig>;
}): boolean {
  if (opts.extensionInstallStatus !== InstallStatus.UPGRADED) {
    return false;
  }
  const pathsToDelete = ConfigUtils.detectDeprecatedConfigs({
    config: opts.rawConfig,
    deprecatedPaths: DEPRECATED_PATHS,
  });
  return pathsToDelete.length > 0;
}

export function shouldDisplayMissingDefaultConfigMessage(opts: {
  extensionInstallStatus: InstallStatus;
  rawConfig: Partial<DendronConfig>;
}): boolean {
  if (opts.extensionInstallStatus !== InstallStatus.UPGRADED) {
    return false;
  }
  const out = ConfigUtils.detectMissingDefaults({ config: opts.rawConfig });
  return out !== undefined && out.needsBackfill;
}

/** Metadata fields used by inactive-user survey gate. */
export type InactiveUserSurveyMeta = {
  inactiveUserMsgStatus?: string;
  firstInstall?: number;
  firstLookupTime?: number;
  lastLookupTime?: number;
  inactiveUserMsgSendTime?: number;
  dendronWorkspaceActivated?: number;
  firstWsInitialize?: number;
};

export type InactiveUserSurveyDecision = {
  shouldSend: boolean;
  /** Why we would prompt (for analytics). */
  reason?: "reprompt" | "initial_prompt";
  currentTime: number;
};

/**
 * Decide whether to show the inactive-user survey from metadata + clock.
 * Side-effect free (no analytics / MetadataService writes).
 */
export function decideInactiveUserSurvey(opts: {
  meta: InactiveUserSurveyMeta;
  currentTimeSeconds: number;
}): InactiveUserSurveyDecision {
  const { meta, currentTimeSeconds: currentTime } = opts;
  const inactiveSurveyMsgStatus = meta.inactiveUserMsgStatus;

  if (inactiveSurveyMsgStatus === InactvieUserMsgStatusEnum.submitted) {
    return { shouldSend: false, currentTime };
  }

  // rare case where global state has been reset (or a reinstall) may cause issues with
  // the prompt logic. ignore these cases and don't show the
  if (meta.firstInstall !== undefined && meta.firstLookupTime !== undefined) {
    if (meta.firstLookupTime - meta.firstInstall < 0) {
      return { shouldSend: false, currentTime };
    }
  }

  const ONE_WEEK = Duration.fromObject({ weeks: 1 });
  const FOUR_WEEKS = Duration.fromObject({ weeks: 4 });
  const CUR_TIME = Duration.fromObject({ seconds: currentTime });

  const FIRST_INSTALL =
    meta.firstInstall !== undefined
      ? Duration.fromObject({ seconds: meta.firstInstall })
      : undefined;

  const FIRST_LOOKUP_TIME =
    meta.firstLookupTime !== undefined
      ? Duration.fromObject({ seconds: meta.firstLookupTime })
      : undefined;

  const LAST_LOOKUP_TIME =
    meta.lastLookupTime !== undefined
      ? Duration.fromObject({ seconds: meta.lastLookupTime })
      : undefined;

  const INACTIVE_USER_MSG_SEND_TIME =
    meta.inactiveUserMsgSendTime !== undefined
      ? Duration.fromObject({ seconds: meta.inactiveUserMsgSendTime })
      : undefined;

  // is the user a first week active user?
  const isFirstWeekActive =
    FIRST_INSTALL !== undefined &&
    FIRST_LOOKUP_TIME !== undefined &&
    FIRST_LOOKUP_TIME.minus(FIRST_INSTALL) <= ONE_WEEK;

  // was the user active on the first week but has been inactive for more than four weeks?
  const isInactive =
    isFirstWeekActive &&
    LAST_LOOKUP_TIME !== undefined &&
    CUR_TIME.minus(LAST_LOOKUP_TIME) >= FOUR_WEEKS;

  // if they have cancelled last time, we should be waiting another four weeks.
  if (inactiveSurveyMsgStatus === InactvieUserMsgStatusEnum.cancelled) {
    const shouldSendAgain =
      INACTIVE_USER_MSG_SEND_TIME !== undefined &&
      CUR_TIME.minus(INACTIVE_USER_MSG_SEND_TIME) >= FOUR_WEEKS &&
      isInactive;
    return {
      shouldSend: shouldSendAgain,
      ...(shouldSendAgain ? { reason: "reprompt" as const } : {}),
      currentTime,
    };
  }

  // this is the first time we are asking them.
  const shouldSend =
    meta.dendronWorkspaceActivated !== undefined &&
    meta.firstWsInitialize !== undefined &&
    isInactive &&
    // this is needed since we may have prompted them before we introduced this metadata
    meta.inactiveUserMsgSendTime === undefined;

  return {
    shouldSend,
    ...(shouldSend ? { reason: "initial_prompt" as const } : {}),
    currentTime,
  };
}
