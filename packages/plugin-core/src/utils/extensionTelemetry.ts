/**
 * Extension install-status tracking + workspace-init analytics.
 */
import {
  ConfigEvents,
  ConfigUtils,
  CONSTANTS,
  CURRENT_AB_TESTS,
  InstallStatus,
  TaskNoteUtils,
  Time,
  VaultUtils,
  VSCodeEvents,
} from "@dendronhq/common-all";
import { DConfig, SegmentClient } from "@dendronhq/common-server";
import { MetadataService } from "@dendronhq/engine-server";
import * as Sentry from "@sentry/node";
import fs from "fs-extra";
import _ from "lodash";
import { Duration } from "luxon";
import path from "path";
import * as vscode from "vscode";
import { URI, Utils } from "vscode-uri";
import { IDendronExtension } from "../dendronExtensionInterface";
import { Logger } from "../logger";
import { MarkdownUtils } from "../utils/md";
import { VersionProvider } from "../versionProvider";
import { VSCodeUtils } from "../vsCodeUtils";
import { AnalyticsUtils } from "./analytics";

/** Before sending saved telemetry events, wait this long (in ms) to make sure
 * the workspace will likely remain open long enough for us to send everything.
 */
export const DELAY_TO_SEND_SAVED_TELEMETRY = 15 * 1000;

let _TUTORIAL_IDS: Set<string> | undefined;

/** Note IDs that are part of our tutorial(s). Excluded from 'numNotes' telemetry. */
export function getTutorialIds(): Set<string> {
  if (_.isUndefined(_TUTORIAL_IDS)) {
    _TUTORIAL_IDS = new Set<string>([
      "ks3b4u7gnd6yiw68qu6ba4m",
      "mycf53kz1r7swcttcobwbdl",
      "kzry3qcy2y4ey1jcf1llajg",
      "y60h6laqi7w462zjp3jyqtt",
      "4do06cts1tme9yz7vfp46bu",
      "5pz82kyfhp2whlzfldxmkzu",
      "kl6ndok3a1f14be6zv771c9",
      "iq3ggn67k1u3v6up8ny3kf5",
      "ie5x2bq5yj7uvenylblnhyr",
      "rjnqumna1ye82u9u76ni42k",
      "wmbd5xz40ohjb8rd5b737cq",
      "epmpyk2kjdxqyvflotan2vt",
      "yyfpeq3th3h17cgvj8cnjw5",
      "lxrp006mal1tfsd7nxmsobe",
      "4u6pv56mnt25d8l2wzfygu7",
      "khv6u4514vnvvy4njhctfru",
      "kyjfnf2rnc6vn71iyn9liz7",
      "c1bs7wsjfbhb0zipaywqfbg", // quickstart-v1
      "c1bs7wsjfbhb0zipaywqv1",
      "c1bs7wsjfbhb0zipaywqins", //quickstart-no-welcome
    ]);
  }
  return _TUTORIAL_IDS;
}

export function getAndTrackInstallStatus({
  UUIDPathExists,
  previousGlobalVersion,
  currentVersion,
}: {
  UUIDPathExists: boolean;
  currentVersion: string;
  previousGlobalVersion: string;
}) {
  const extensionInstallStatus = VSCodeUtils.getInstallStatusForExtension({
    previousGlobalVersion,
    currentVersion,
  });

  // check if this is an install event, but a repeated one on a new instance.
  let isSecondaryInstall = false;

  // set initial install ^194e5bw7so9g
  if (extensionInstallStatus === InstallStatus.INITIAL_INSTALL) {
    // even if it's an initial install for this instance of vscode, it may not be for this machine.
    // in that case, we should skip setting the initial install time since it's already set.
    // we also check if we already set uuid for this machine. If so, this is not a true initial install.
    const metadata = MetadataService.instance().getMeta();
    if (metadata.firstInstall === undefined && !UUIDPathExists) {
      MetadataService.instance().setInitialInstall();
      const version = VersionProvider.version();
      MetadataService.instance().setInitialInstallVersion(version);
    } else {
      // we still want to proceed with InstallStatus.INITIAL_INSTALL because we want everything
      // tied to initial install to happen in this instance of VSCode once for the first time
      isSecondaryInstall = true;
    }
  }

  // TODO: temporary backfill
  if (_.isUndefined(MetadataService.instance().getMeta().firstInstall)) {
    const time = Time.DateTime.fromISO("2021-06-22");
    MetadataService.instance().setInitialInstall(time.toSeconds());
  }
  return { extensionInstallStatus, isSecondaryInstall };
}

/**
 * Try to infer install code instance age from extension path
 * this will not be accurate in dev mode because the extension install path is the monorepo.
 * return the creation time and lapsed time in weeks
 */
export function getCodeFolderCreated(opts: {
  context: vscode.ExtensionContext;
}) {
  const { context } = opts;
  try {
    // infer install path from extension path.
    // this assumes the user installs all extensions in one place.
    // that should be the case for almost all cases, but vscode provides a way to
    // customize install location so this might not be for those rare cases.
    const installPath = Utils.dirname(
      Utils.dirname(URI.file(context.extensionPath)),
    ).fsPath;
    const fd = fs.openSync(installPath, "r");
    const stat = fs.fstatSync(fd);
    // some file systems don't track birth times.
    // in this case the value may be ctime (time of inode change), or 0
    const { birthtimeMs } = stat;

    const currentTime = Duration.fromMillis(Time.now().toMillis());
    const birthTime = Duration.fromMillis(birthtimeMs);
    const ageOfCodeInstallInWeeks = Math.round(
      currentTime.minus(birthTime).as("weeks"),
    );
    return {
      codeFolderCreated: birthtimeMs,
      ageOfCodeInstallInWeeks,
    };
  } catch (error: any) {
    // something went wrong. don't track. Send to sentry silently.
    Sentry.captureException(error);
    return {};
  }
}

/**
 * Analytics related to initializing the workspace
 */
export async function trackWorkspaceInit({
  durationReloadWorkspace,
  ext,
  activatedSuccess,
}: {
  durationReloadWorkspace: number;
  ext: IDendronExtension;
  activatedSuccess: boolean;
}) {
  const engine = ext.getEngine();
  const workspace = ext.getDWorkspace();
  const {
    wsRoot,
    vaults,
    type: workspaceType,
    config: dendronConfig,
  } = workspace;
  const notes = await engine.findNotesMeta({ excludeStub: false });
  let numNotes = notes.length;

  let numNoteRefs = 0;
  let numWikilinks = 0;
  let numBacklinks = 0;
  let numLinkCandidates = 0;
  let numFrontmatterTags = 0;
  let numTutorialNotes = 0;
  let numTaskNotes = 0;

  const tutorialIds = getTutorialIds();

  // Takes about ~10 ms to compute in org-workspace
  notes.forEach((val) => {
    val.links.forEach((link) => {
      switch (link.type) {
        case "ref":
          numNoteRefs += 1;
          break;
        case "wiki":
          numWikilinks += 1;
          break;
        case "backlink":
          numBacklinks += 1;
          break;
        case "linkCandidate":
          numLinkCandidates += 1;
          break;
        case "frontmatterTag":
          numFrontmatterTags += 1;
          break;
        default:
          break;
      }
    });

    if (tutorialIds.has(val.id)) {
      numTutorialNotes += 1;
    }
    if (TaskNoteUtils.isTaskNote(val)) {
      numTaskNotes += 1;
    }
  });

  // These are the values for the original tutorial; approximate is ok here.
  const tutorialWikiLinkCount = 19;
  const tutorialNoteRefCount = 1;
  const tutorialBacklinkCount = 18;

  if (numTutorialNotes > 0) {
    numNotes -= numTutorialNotes;
    numWikilinks = Math.max(0, numWikilinks - tutorialWikiLinkCount);
    numNoteRefs = Math.max(0, numNoteRefs - tutorialNoteRefCount);
    numBacklinks = Math.max(0, numBacklinks - tutorialBacklinkCount);
  }

  const numSchemas = _.size(await (await engine.querySchema("*")).data);
  const codeWorkspacePresent = await fs.pathExists(
    path.join(wsRoot, CONSTANTS.DENDRON_WS_NAME),
  );
  const publishigConfig = ConfigUtils.getPublishing(dendronConfig);
  const siteUrl = publishigConfig.siteUrl;
  const publishingTheme = dendronConfig?.publishing?.theme;
  const previewTheme = dendronConfig?.preview?.theme;
  const enabledExportPodV2 = dendronConfig.dev?.enableExportPodV2;
  const { workspaceFile, workspaceFolders } = vscode.workspace;
  const configVersion = ConfigUtils.getVersion(dendronConfig);

  const configDiff = ConfigUtils.findDifference({ config: dendronConfig });
  const dendronConfigChanged = configDiff.length > 0;

  const trackProps = {
    duration: durationReloadWorkspace,
    numNotes,
    numNoteRefs,
    numWikilinks,
    numBacklinks,
    numLinkCandidates,
    numFrontmatterTags,
    numSchemas,
    numVaults: vaults.length,
    numTutorialNotes,
    numTaskNotes,
    workspaceType,
    codeWorkspacePresent,
    configVersion,
    selfContainedVaultsEnabled:
      dendronConfig.dev?.enableSelfContainedVaults || false,
    numSelfContainedVaults: vaults.filter(VaultUtils.isSelfContained).length,
    numRemoteVaults: vaults.filter(VaultUtils.isRemote).length,
    numWorkspaceVaults: vaults.filter((vault) => vault.workspace !== undefined)
      .length,
    numSeedVaults: vaults.filter((vault) => vault.seed !== undefined).length,
    activationSucceeded: activatedSuccess,
    hasLegacyPreview: MarkdownUtils.hasLegacyPreview(),
    enabledExportPodV2,
    hasWorkspaceFile: !_.isUndefined(workspaceFile),
    workspaceFolders: _.isUndefined(workspaceFolders)
      ? 0
      : workspaceFolders.length,
    hasLocalConfig: false,
    numLocalConfigVaults: 0,
    dendronConfigChanged,
  };

  if (dendronConfigChanged) {
    _.set(trackProps, "numConfigChanged", configDiff.length);
    /**
     * This is a separate event because {@link VSCodeEvents.InitializeWorkspace} is getting a little crowded.
     * The payload will be stored in a _single column_ with a `text` type, and there is no to the length.
     * There is a hard limit of 1GB per field, but not a concern here.
     */
    AnalyticsUtils.track(ConfigEvents.ConfigChangeDetected, {
      changed: JSON.stringify(configDiff),
    });
  }

  if (siteUrl !== undefined) {
    _.set(trackProps, "siteUrl", siteUrl);
  }
  if (publishingTheme !== undefined) {
    _.set(trackProps, "publishingTheme", publishingTheme);
  }
  if (previewTheme !== undefined) {
    _.set(trackProps, "previewTheme", previewTheme);
  }

  const allExtensions = vscode.extensions.all;
  let allNonBuiltInExtensions = allExtensions.filter((extension) => {
    return !extension.packageJSON.isBuiltin;
  });
  if (VSCodeUtils.isDevMode()) {
    // done to make this work during dev mode
    allNonBuiltInExtensions = allNonBuiltInExtensions.filter((ext) => {
      return !ext.extensionPath.includes("packages/plugin-core");
    });
  }
  try {
    const extensionsDetail = allNonBuiltInExtensions.map((extension) => {
      const { packageJSON } = extension;
      const { id, version } = packageJSON;
      return { id, version };
    });
    if (extensionsDetail && extensionsDetail.length > 0) {
      _.set(trackProps, "extensionsDetail", extensionsDetail);
      _.set(trackProps, "numExtensions", extensionsDetail.length);
    }
  } catch (error) {
    // something went wrong don't track extension detail
    Sentry.captureException(error);
  }

  // NOTE: this will not be accurate in dev mode
  const { codeFolderCreated, ageOfCodeInstallInWeeks } = getCodeFolderCreated({
    context: ext.context,
  });
  if (codeFolderCreated) {
    _.set(trackProps, "codeFolderCreated", codeFolderCreated);
  }
  if (ageOfCodeInstallInWeeks) {
    _.set(trackProps, "ageOfCodeInstallInWeeks", ageOfCodeInstallInWeeks);
  }

  const maybeLocalConfig = DConfig.searchLocalConfigSync(wsRoot);
  if (maybeLocalConfig.data) {
    trackProps.hasLocalConfig = true;
    if (maybeLocalConfig.data.workspace.vaults) {
      trackProps.numLocalConfigVaults =
        maybeLocalConfig.data.workspace.vaults.length;
    }
  }

  AnalyticsUtils.identify({
    numNotes,
    // Which side of all currently running tests is this user on?
    splitTests: CURRENT_AB_TESTS.map(
      (test) =>
        // Formatted as `testName.groupName` since group names are not necessarily unique
        `${test.name}.${test.getUserGroup(SegmentClient.instance().anonymousId)}`,
    ),
  });
  AnalyticsUtils.track(VSCodeEvents.InitializeWorkspace, trackProps);
  setTimeout(() => {
    Logger.info("sendSavedAnalytics"); // TODO
    AnalyticsUtils.sendSavedAnalytics();
  }, DELAY_TO_SEND_SAVED_TELEMETRY);
}
